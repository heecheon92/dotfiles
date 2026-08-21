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
    local target_window = wezterm:mainWindow()
    if target_screen ~= nil and target_window ~= nil then
      target_window:centerOnScreen(target_screen, true, 0)
    end
    wezterm:activate(true)
  end
end

local wezterm_hotkey = hs.hotkey.bind({ "ctrl" }, GRAVE_KEY_CODE, toggle_wezterm)
if wezterm_hotkey == nil then
  hs.alert.show("Could not register Ctrl+` for WezTerm")
end
