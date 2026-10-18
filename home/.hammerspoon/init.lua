hs.autoLaunch(true)

local TERN_BUNDLE_ID = "so.stencil.tern"
local GRAVE_KEY_CODE = 50

local function toggle_tern()
  local tern = hs.application.get(TERN_BUNDLE_ID)
  if tern == nil then
    return
  end

  if tern:isFrontmost() then
    tern:hide()
  else
    local target_screen = hs.mouse.getCurrentScreen()
    tern:activate(true)

    -- Place the window after activation has settled.
    if target_screen ~= nil then
      hs.timer.doAfter(0.1, function()
        local target_window = tern:mainWindow()
        if target_window ~= nil then
          target_window:centerOnScreen(target_screen, false, 0)
        end
      end)
    end
  end
end

local tern_hotkey = hs.hotkey.bind({ "ctrl" }, GRAVE_KEY_CODE, toggle_tern)
if tern_hotkey == nil then
  hs.alert.show("Could not register Ctrl+` for Tern")
end
