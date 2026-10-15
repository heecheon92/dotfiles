#import <AppKit/AppKit.h>
#import <ApplicationServices/ApplicationServices.h>
#include <dispatch/dispatch.h>
#include <fcntl.h>
#include <sys/file.h>
#include <unistd.h>

static void fail(NSString *message) {
    fprintf(stderr, "neovide-scratch: %s\n", message.UTF8String);
    exit(1);
}

static NSString *aerospace(NSString *executable, NSArray<NSString *> *arguments) {
    NSTask *task = [NSTask new];
    task.executableURL = [NSURL fileURLWithPath:executable];
    task.arguments = arguments;
    NSPipe *output = [NSPipe pipe];
    task.standardOutput = output;
    NSError *error = nil;
    if (![task launchAndReturnError:&error]) fail(error.localizedDescription);
    NSData *data = [output.fileHandleForReading readDataToEndOfFile];
    [task waitUntilExit];
    if (task.terminationStatus != 0) fail(@"AeroSpace command failed.");
    NSString *text = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
    if (!text) fail(@"AeroSpace returned invalid text.");
    return [text stringByTrimmingCharactersInSet:NSCharacterSet.whitespaceAndNewlineCharacterSet];
}

static BOOL visibleWindowReady(pid_t pid) {
    NSArray *windows = CFBridgingRelease(CGWindowListCopyWindowInfo(
        kCGWindowListOptionOnScreenOnly | kCGWindowListExcludeDesktopElements, kCGNullWindowID));
    NSUInteger count = 0;
    for (NSDictionary *window in windows) {
        if ([window[(__bridge NSString *)kCGWindowOwnerPID] intValue] == pid &&
            [window[(__bridge NSString *)kCGWindowLayer] intValue] == 0) count++;
    }
    if (count > 1) fail(@"Expected one new Neovide window; refusing to reposition multiple windows.");
    return count == 1;
}

static void pauseUntil(NSDate *deadline) {
    if (deadline.timeIntervalSinceNow <= 0) fail(@"Timed out waiting for the new Neovide window; no window was closed.");
    [NSRunLoop.currentRunLoop runUntilDate:[NSDate dateWithTimeIntervalSinceNow:0.05]];
}

int main(int argc, const char *argv[]) {
    @autoreleasepool {
        if (argc != 4) fail(@"Expected screen index, Nix Neovim path, and AeroSpace path.");
        char *end = NULL;
        long index = strtol(argv[1], &end, 10);
        NSArray<NSScreen *> *screens = NSScreen.screens;
        if (*end || index < 1 || (NSUInteger)index > screens.count) fail(@"Invalid active screen index.");
        NSScreen *screen = screens[index - 1];
        NSNumber *displayID = screen.deviceDescription[@"NSScreenNumber"];
        NSRect visibleFrame = screen.visibleFrame;
        CGFloat desktopTop = NSMaxY(screens.firstObject.frame);
        NSString *nvim = [NSString stringWithUTF8String:argv[2]];
        NSString *aerospaceBin = [NSString stringWithUTF8String:argv[3]];

        // Serialize only launches. Closing a process releases the advisory lock.
        NSString *lockPath = [NSTemporaryDirectory() stringByAppendingPathComponent:@"neovide-scratch-launch.lock"];
        int lock = open(lockPath.fileSystemRepresentation, O_CREAT | O_RDWR | O_CLOEXEC | O_NOFOLLOW, 0600);
        if (lock < 0 || flock(lock, LOCK_EX) != 0) fail(@"Cannot acquire the scratch launch lock.");
        NSArray<NSRunningApplication *> *running =
            [NSRunningApplication runningApplicationsWithBundleIdentifier:@"com.neovide.neovide"];
        if (running.count > 1) fail(@"Multiple Neovide processes are running; refusing an ambiguous scratch target.");
        if (running.count == 1) {
            printf("%d\n", running.firstObject.processIdentifier);
            return 0; // A concurrent launch won: never recenter an existing window.
        }
        if (!AXIsProcessTrusted()) fail(@"Accessibility access is required to center the scratch window. Enable it in System Settings > Privacy & Security > Accessibility, then retry. No permission was requested automatically.");

        NSWorkspaceOpenConfiguration *configuration = [NSWorkspaceOpenConfiguration configuration];
        configuration.createsNewApplicationInstance = NO;
        configuration.arguments = @[@"--neovim-bin", nvim, @"--chdir", NSHomeDirectory(), @"--grid", @"100x30"];
        configuration.environment = @{
            @"HOME": NSHomeDirectory(), @"USER": NSUserName(), @"LOGNAME": NSUserName(),
            @"PATH": @"/usr/bin:/bin:/usr/sbin:/sbin"
        };
        __block NSRunningApplication *application = nil;
        __block NSError *launchError = nil;
        __block BOOL completed = NO;
        NSDate *deadline = [NSDate dateWithTimeIntervalSinceNow:10];
        [NSWorkspace.sharedWorkspace openApplicationAtURL:[NSURL fileURLWithPath:@"/Applications/Neovide.app"]
            configuration:configuration completionHandler:^(NSRunningApplication *app, NSError *error) {
                dispatch_async(dispatch_get_main_queue(), ^{
                    application = app;
                    launchError = error;
                    completed = YES;
                });
            }];
        while (!completed) pauseUntil(deadline);
        if (!application) fail(launchError.localizedDescription ?: @"Neovide could not be launched.");
        pid_t pid = application.processIdentifier;
        AXUIElementRef appElement = AXUIElementCreateApplication(pid);
        AXUIElementSetMessagingTimeout(appElement, 1.0);
        AXUIElementRef window = NULL;
        NSString *windowID = nil;
        while (!window) {
            if (application.terminated) fail(@"Neovide exited before its scratch window was ready.");
            CFTypeRef value = NULL;
            AXError result = AXUIElementCopyAttributeValue(appElement, kAXWindowsAttribute, &value);
            if (result == kAXErrorSuccess && value && CFGetTypeID(value) == CFArrayGetTypeID()) {
                CFArrayRef windows = (CFArrayRef)value;
                CFIndex count = CFArrayGetCount(windows);
                if (count > 1) fail(@"Expected one AX window in the new Neovide process; refusing an ambiguous target.");
                // Neovide 0.16.2 shows its first window only after applying startup geometry.
                if (count == 1 && visibleWindowReady(pid)) {
                    windowID = aerospace(aerospaceBin, @[@"list-windows", @"--monitor", @"all", @"--pid",
                        [NSString stringWithFormat:@"%d", pid], @"--format", @"%{window-id}"]);
                    if (windowID.length && [windowID rangeOfCharacterFromSet:
                        NSCharacterSet.decimalDigitCharacterSet.invertedSet].location == NSNotFound) {
                        window = (AXUIElementRef)CFRetain(CFArrayGetValueAtIndex(windows, 0));
                    } else if (windowID.length) fail(@"AeroSpace reported multiple or invalid scratch window IDs.");
                }
            }
            if (value) CFRelease(value);
            if (!window) pauseUntil(deadline);
        }
        CFRelease(appElement);
        // Synchronize floating before positioning; the bundle-ID rule owns normal startup floating.
        aerospace(aerospaceBin, @[@"layout", @"floating", @"--window-id", windowID]);
        BOOL screenPresent = NO;
        for (NSScreen *current in NSScreen.screens) {
            if ([current.deviceDescription[@"NSScreenNumber"] isEqual:displayID]) screenPresent = YES;
        }
        if (!screenPresent) fail(@"The original active display was disconnected; no position was changed.");
        CFTypeRef sizeValue = NULL;
        CGSize size;
        if (AXUIElementCopyAttributeValue(window, kAXSizeAttribute, &sizeValue) != kAXErrorSuccess ||
            !sizeValue || CFGetTypeID(sizeValue) != AXValueGetTypeID() ||
            !AXValueGetValue((AXValueRef)sizeValue, kAXValueCGSizeType, &size)) {
            fail(@"Cannot read the new scratch window size.");
        }
        CFRelease(sizeValue);
        CGPoint position = CGPointMake(
            NSMinX(visibleFrame) + (NSWidth(visibleFrame) - size.width) / 2,
            desktopTop - NSMaxY(visibleFrame) + (NSHeight(visibleFrame) - size.height) / 2);
        AXValueRef positionValue = AXValueCreate(kAXValueCGPointType, &position);
        AXError result = AXUIElementSetAttributeValue(window, kAXPositionAttribute, positionValue);
        CFRelease(positionValue);
        CFRelease(window);
        if (result != kAXErrorSuccess) fail([NSString stringWithFormat:@"Cannot center the new scratch window (AX error %d).", result]);
        printf("%d\n", pid);
        close(lock);
        return 0;
    }
}
