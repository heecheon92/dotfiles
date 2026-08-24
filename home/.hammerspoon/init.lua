hs.autoLaunch(true)

local WEZTERM_BUNDLE_ID = "com.github.wez.wezterm"
local GRAVE_KEY_CODE = 50

local function toggle_wezterm()
  local wezterm = hs.application.get(WEZTERM_BUNDLE_ID)
  if wezterm == nil then
    return
  end

  if wezterm:isFrontmost() then
    wezterm:hide()
  else
    local target_screen = hs.mouse.getCurrentScreen()
    wezterm:activate(true)

    -- Focus changes can trigger WezTerm config updates, so place the window
    -- after activation has settled instead of letting those updates undo it.
    if target_screen ~= nil then
      hs.timer.doAfter(0.1, function()
        local target_window = wezterm:mainWindow()
        if target_window ~= nil then
          target_window:centerOnScreen(target_screen, false, 0)
        end
      end)
    end
  end
end

local wezterm_window_sizes = {}

local function remember_wezterm_window_size(window)
  local id = window:id()
  if id == nil then
    return
  end

  local size = window:size()
  wezterm_window_sizes[id] = { w = size.w, h = size.h }
end

local function center_wezterm_after_resize(window)
  local id = window:id()
  if id == nil then
    return
  end

  local size = window:size()
  local previous_size = wezterm_window_sizes[id]
  wezterm_window_sizes[id] = { w = size.w, h = size.h }

  if window:isFullScreen()
    or previous_size == nil
    or (previous_size.w == size.w and previous_size.h == size.h)
  then
    return
  end

  window:centerOnScreen(window:screen(), true, 0)
end

local function forget_wezterm_window_size(window)
  local id = window:id()
  if id ~= nil then
    wezterm_window_sizes[id] = nil
  end
end

local wezterm_windows = hs.window.filter.new(function(window)
  local application = window:application()
  return application ~= nil and application:bundleID() == WEZTERM_BUNDLE_ID
end)

for _, window in ipairs(wezterm_windows:getWindows()) do
  remember_wezterm_window_size(window)
end

wezterm_windows
  :subscribe(hs.window.filter.windowCreated, remember_wezterm_window_size)
  :subscribe(hs.window.filter.windowMoved, center_wezterm_after_resize)
  :subscribe(hs.window.filter.windowDestroyed, forget_wezterm_window_size)

local wezterm_hotkey = hs.hotkey.bind({ "ctrl" }, GRAVE_KEY_CODE, toggle_wezterm)
if wezterm_hotkey == nil then
  hs.alert.show("Could not register Ctrl+` for WezTerm")
end
