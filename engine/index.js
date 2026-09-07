/**
 * UNIFIVE.P5 Engine - Core Module Aggregator
 * Central entry point for all engine subsystems
 */
(function (global) {
  'use strict';

  const ENGINE_MODULES = [
    'engine/core/async_scene_store.js',
    'engine/config/world_config.js',
    'engine/ui/mouse_tool_controller.js',
    'engine/audio/sound_engine.js',
    'engine/ui/view_controller.js',
    'engine/ui/create_panel_controller.js',
    'engine/ui/mobile_navigation_controller.js',
    'engine/ui/tab_controller.js',
    'engine/ui/layers_controller.js',
    'engine/ui/config_controller.js',
    'engine/ui/properties_controller.js',
    'engine/world/crop_controller.js',
    'engine/world/sprite_poses_controller.js',
    'engine/world/world_objects_manager.js',
    'engine/core/history_manager.js',
    'engine/core/canvas_dimensions.js',
    'engine/core/variable_manager.js',
    'engine/scripting/app_mode_controller.js',
    'engine/scripting/code_runtime_engine.js',
    'engine/scripting/u5_compiler.js',
    'engine/lifecycle.js'
  ];

  if (typeof document !== 'undefined') {
    const scripts = document.getElementsByTagName('script');
    let basePath = '';
    for (let i = scripts.length - 1; i >= 0; i--) {
      const src = scripts[i].src || '';
      if (src.includes('engine/index.js') || src.includes('app.js')) {
        const parts = src.split('/');
        parts.pop();
        if (src.includes('engine/index.js')) parts.pop();
        basePath = parts.join('/');
        if (basePath && !basePath.endsWith('/')) basePath += '/';
        break;
      }
    }
    ENGINE_MODULES.forEach(function (modPath) {
      document.write('<script src="' + (basePath ? basePath + modPath : modPath) + '"><\/script>');
    });
  }

  global.UNIFIVE_ENGINE = {
    version: '1.0.0',
    modules: ENGINE_MODULES
  };
})(typeof window !== 'undefined' ? window : globalThis);
