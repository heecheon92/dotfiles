local wezterm = require("wezterm")
-- A first pull can precede Home Manager's generated host module. Keep native
-- terminal shortcuts until that rebuild; do not hide malformed module errors.
local host = { aerospace = false }
local host_path = wezterm.config_dir .. "/host.lua"
local host_file, host_error, host_errno = io.open(host_path, "r")
if host_file then
	host_file:close()
	host = dofile(host_path)
elseif host_errno ~= 2 then
	error(host_error)
end

local config = wezterm.config_builder()

config.color_scheme = "Monokai Pro (Gogh)"
config.font = wezterm.font_with_fallback({
	"Hack Nerd Font Mono",
	"Herdr Agent Icons Max",
})
config.font_size = 14.0
config.window_background_opacity = 0.8
config.macos_window_background_blur = 50
config.hide_tab_bar_if_only_one_tab = true
config.window_decorations = "RESIZE"

-- Only AeroSpace hosts hand fullscreen control to the window manager.
if host.aerospace then
	config.keys = {
		{ key = "Enter", mods = "ALT", action = wezterm.action.DisableDefaultAssignment },
	}
end

-- Option+Shift+Enter marks a dedicated GUI process, never an existing window.
if host.aerospace and os.getenv("DOTFILES_WEZTERM_FLOAT") == "1" then
	-- Do not let a terminal launched from this shell inherit the startup request.
	config.set_environment_variables = {
		DOTFILES_WEZTERM_FLOAT = "",
		DOTFILES_AEROSPACE_BIN = "",
	}

	local function center_startup_window(window)
		local startup = wezterm.GLOBAL.floating_startup
		if not startup or startup.window_id ~= window:window_id() then
			return
		end
		local dimensions = window:get_dimensions()
		if not wezterm.GLOBAL.floating_startup then
			return
		end
		local screen, main = startup.screen, startup.main
		-- macOS screens() uses bottom-left backing pixels; set_position() uses
		-- top-left pixels at the primary screen's scale (including mixed Retina).
		local x = (screen.x + (screen.width - dimensions.pixel_width) / 2) / screen.scale
		local y = (screen.y + (screen.height + dimensions.pixel_height) / 2) / screen.scale
		window:set_position(math.floor(x * main.scale + 0.5), math.floor(main.height - y * main.scale + 0.5))
	end

	wezterm.on("window-resized", function(window)
		if wezterm.GLOBAL.floating_startup then
			wezterm.time.call_after(0.1, function()
				center_startup_window(window)
			end)
		end
	end)

	wezterm.on("gui-startup", function(cmd)
		local screens = wezterm.gui.screens()
		local _, _, mux_window = wezterm.mux.spawn_window(cmd or {})
		local window = mux_window:gui_window()
		local aerospace = os.getenv("DOTFILES_AEROSPACE_BIN")
		if not aerospace or aerospace == "" then
			wezterm.log_error("Floating startup: missing AeroSpace executable; leaving the new window tiled")
			return
		end
		local pid = tostring(wezterm.procinfo.pid())
		local attempts = 0
		local function detect_window()
			attempts = attempts + 1
			local ok, stdout, stderr = wezterm.run_child_process({
				aerospace,
				"list-windows",
				"--monitor",
				"all",
				"--pid",
				pid,
				"--format",
				"%{window-id}",
			})
			if not ok then
				wezterm.log_error("Floating startup: AeroSpace detection failed: " .. stderr)
				return
			end
			local ids = {}
			for id in stdout:gmatch("%S+") do
				if not id:match("^%d+$") then
					wezterm.log_error("Floating startup: unexpected AeroSpace window ID: " .. id)
					return
				end
				table.insert(ids, id)
			end
			if #ids > 1 then
				wezterm.log_error(
					"Floating startup: multiple windows belong to GUI PID " .. pid .. "; leaving them unchanged"
				)
				return
			elseif #ids == 0 then
				if attempts < 30 then
					wezterm.time.call_after(0.1, detect_window)
				else
					wezterm.log_error("Floating startup: timed out detecting the new window for GUI PID " .. pid)
				end
				return
			end
			local floated, _, float_error = wezterm.run_child_process({
				aerospace,
				"layout",
				"floating",
				"--window-id",
				ids[1],
			})
			if not floated then
				wezterm.log_error(
					"Floating startup: AeroSpace could not float window " .. ids[1] .. ": " .. float_error
				)
				return
			end
			-- Focus dimming reloads the config; keep only this short-lived startup
			-- identity across reloads, then release it so later moves stay manual.
			wezterm.GLOBAL.floating_startup = {
				window_id = window:window_id(),
				screen = screens.active,
				main = screens.main,
			}
			wezterm.time.call_after(0.1, function()
				center_startup_window(window)
			end)
			wezterm.time.call_after(2, function()
				center_startup_window(window)
				wezterm.GLOBAL.floating_startup = nil
			end)
		end
		wezterm.time.call_after(0.1, detect_window)
	end)
end

config.default_cursor_style = "BlinkingBlock"
config.cursor_blink_rate = 200
config.cursor_blink_ease_in = "Constant"
config.cursor_blink_ease_out = "Constant"

-- Dim unfocused windows so the focused one is obvious at a glance.
local UNFOCUSED_FOREGROUND_TEXT_HSB = { hue = 1.0, saturation = 0.25, brightness = 0.45 }
local UNFOCUSED_WINDOW_BACKGROUND_OPACITY = 0.62

-- get_config_overrides() hands back a copy, so the current value is never the
-- same table we last stored; compare the fields instead of the identity.
local function same_text_hsb(actual, expected)
	if actual == nil or expected == nil then
		return actual == expected
	end
	return actual.hue == expected.hue
		and actual.saturation == expected.saturation
		and actual.brightness == expected.brightness
end

wezterm.on("window-focus-changed", function(window)
	local overrides = window:get_config_overrides() or {}
	local text_hsb, opacity
	if not window:is_focused() then
		text_hsb = UNFOCUSED_FOREGROUND_TEXT_HSB
		opacity = UNFOCUSED_WINDOW_BACKGROUND_OPACITY
	end

	-- Only write when one of the two values we own actually changes; a redundant
	-- set_config_overrides() call would trigger another config reload.
	if same_text_hsb(overrides.foreground_text_hsb, text_hsb) and overrides.window_background_opacity == opacity then
		return
	end

	overrides.foreground_text_hsb = text_hsb
	overrides.window_background_opacity = opacity
	window:set_config_overrides(overrides)
end)

return config
