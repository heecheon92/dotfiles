#ifndef INPUT_SOURCE_H
#define INPUT_SOURCE_H

#include <Carbon/Carbon.h>
#include <stdbool.h>
#include <stdio.h>

static inline bool input_source_print_language(void) {
  bool printed = false;
  TISInputSourceRef source = TISCopyCurrentKeyboardInputSource();

  if (source) {
    CFArrayRef languages = TISGetInputSourceProperty(
        source, kTISPropertyInputSourceLanguages);

    if (languages && CFGetTypeID(languages) == CFArrayGetTypeID()
        && CFArrayGetCount(languages) > 0) {
      CFTypeRef value = CFArrayGetValueAtIndex(languages, 0);

      if (value && CFGetTypeID(value) == CFStringGetTypeID()) {
        char language[64];
        if (CFStringGetCString((CFStringRef)value,
                               language,
                               sizeof(language),
                               kCFStringEncodingUTF8)) {
          puts(language);
          printed = true;
        }
      }
    }

    CFRelease(source);
  }

  if (!printed) puts("?");
  return printed;
}

#endif
