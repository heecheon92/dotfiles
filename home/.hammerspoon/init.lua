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

local wezterm_hotkey = hs.hotkey.bind({ "ctrl" }, GRAVE_KEY_CODE, toggle_wezterm)
if wezterm_hotkey == nil then
  hs.alert.show("Could not register Ctrl+` for WezTerm")
end
