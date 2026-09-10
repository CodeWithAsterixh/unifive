/**
 * UNIFIVE.P5 Engine - Core Module Aggregator
 * Central entry point for all engine subsystems
 */
(function (global) {
  'use strict';

  const ENGINE_MODULES = [
    // 1. Core Data Models & Stores
    'engine/core/scene_serializer.js',
    'engine/core/async_scene_store_default.js',
    'engine/core/async_scene_store.js',
    'engine/core/async_scene_store_saver.js',
    'engine/core/async_scene_store_loader.js',
    'engine/core/canvas_dimensions.js',
    'engine/core/history_manager.js',
    'engine/core/variable_crud.js',
    'engine/core/variable_store.js',
    'engine/core/watcher_renderer.js',
    'engine/core/watcher_interaction.js',
    'engine/core/variable_watchers.js',
    'engine/core/variable_manager.js',

    // 2. Camera, Config & Audio
    'engine/config/stage_camera.js',
    'engine/config/world_pan.js',
    'engine/config/world_config.js',
    'engine/audio/synth_core.js',
    'engine/audio/action_history_sounds.js',
    'engine/audio/action_save_sound.js',
    'engine/audio/action_toggle_sound.js',
    'engine/audio/preset_synth_sounds.js',
    'engine/audio/preset_melody_sounds.js',
    'engine/audio/sound_effects.js',
    'engine/audio/sound_indicator.js',
    'engine/audio/sound_engine.js',

    // 3. UI Controls & Panels
    'engine/ui/dock_pointer_start.js',
    'engine/ui/dock_pointer_move_end.js',
    'engine/ui/dock_drag_handler.js',
    'engine/ui/dock_controller.js',
    'engine/ui/mouse_tools.js',
    'engine/ui/mouse_tool_controller.js',
    'engine/ui/view_controller.js',
    'engine/ui/create_fallback_data.js',
    'engine/ui/create_cat_button.js',
    'engine/ui/create_palette.js',
    'engine/ui/create_card_builder.js',
    'engine/ui/create_items.js',
    'engine/ui/create_panel_controller.js',
    'engine/ui/drawer_panels.js',
    'engine/ui/drawer_toggle_buttons.js',
    'engine/ui/drawer_navigation.js',
    'engine/ui/bottom_nav.js',
    'engine/ui/mobile_navigation_controller.js',
    'engine/ui/tab_controller.js',
    'engine/ui/layers_tree.js',
    'engine/ui/layers_drag.js',
    'engine/ui/layers_toolbar_buttons.js',
    'engine/ui/layers_reorder_mutations.js',
    'engine/ui/layers_toggle_mutations.js',
    'engine/ui/layers_mutations.js',
    'engine/ui/layers_controller.js',
    'engine/ui/stage_limits.js',
    'engine/ui/cfg_color_picker.js',
    'engine/ui/cfg_toggles.js',
    'engine/ui/config_modal.js',
    'engine/ui/config_controller.js',
    'engine/ui/prop_name_position.js',
    'engine/ui/prop_size_rotation.js',
    'engine/ui/prop_bindings_transform.js',
    'engine/ui/prop_flip_opacity.js',
    'engine/ui/prop_collision_playable.js',
    'engine/ui/prop_bindings_physics.js',
    'engine/ui/properties_bindings.js',
    'engine/ui/properties_inspector.js',
    'engine/ui/properties_controller.js',

    // 4. World, Sprites & Crop Systems
    'engine/world/crop_math.js',
    'engine/world/crop_renderer.js',
    'engine/world/crop_events.js',
    'engine/world/crop_mutations.js',
    'engine/world/crop_controller.js',
    'engine/world/crop_ops.js',
    'engine/world/pose_animator.js',
    'engine/world/pose_card_builder.js',
    'engine/world/pose_cards.js',
    'engine/world/sprite_poses_panel.js',
    'engine/world/sprite_poses_controller.js',
    'engine/world/objects_asset_loader.js',
    'engine/world/objects_crud.js',
    'engine/world/objects_zorder.js',
    'engine/world/objects_store.js',
    'engine/world/objects_transform.js',
    'engine/world/objects_renderer.js',
    'engine/world/world_objects_manager.js',
    'engine/world/world_objects_ops.js',
    'engine/world/world_objects_serialization.js',
    'engine/world/world_objects_zorder_proxy.js',

    // 5. Scripting, Block Palette & Compiler
    'engine/scripting/compiler_presets.js',
    'engine/scripting/compiler_assets.js',
    'engine/scripting/compiler_packager.js',
    'engine/scripting/compiler_loader.js',
    'engine/scripting/u5_compiler.js',
    'engine/scripting/eval_reporters.js',
    'engine/scripting/eval_conditions.js',
    'engine/scripting/runtime_evaluator.js',
    'engine/scripting/builtin_motion.js',
    'engine/scripting/builtin_looks.js',
    'engine/scripting/builtin_extended.js',
    'engine/scripting/runtime_builtins.js',
    'engine/scripting/runtime_events.js',
    'engine/scripting/runtime_threads.js',
    'engine/scripting/code_runtime_engine.js',
    'engine/scripting/block_palette.js',
    'engine/scripting/block_connectors.js',
    'engine/scripting/block_drag_snap.js',
    'engine/scripting/mode_switcher.js',
    'engine/scripting/app_mode_controller.js',
    'engine/scripting/app_mode_target.js',

    // 6. Game Player Subsystems
    'engine/player/vcontrol_state.js',
    'engine/player/vcontrol_dom.js',
    'engine/player/vcontrol_touch.js',
    'engine/player/vcontrol_stick.js',
    'engine/player/vcontrol_resize.js',
    'engine/player/vcontrol_customizer.js',
    'engine/player/mobile_controls.js',
    'engine/player/player_input.js',
    'engine/player/player_state.js',
    'engine/player/player_camera.js',
    'engine/player/player_physics.js',
    'engine/player/player_menu.js',
    'engine/player/game_player_engine.js',

    // 7. p5.js Lifecycle & Canvas Event Loop
    'engine/ui/splitter_controller.js',
    'engine/ui/header_undo_redo.js',
    'engine/ui/header_sound_fullscreen.js',
    'engine/ui/header_actions.js',
    'engine/ui/keyboard_shortcuts.js',
    'engine/ui/ui_listeners.js',
    'engine/lifecycle_setup.js',
    'engine/lifecycle_draw.js',
    'engine/lifecycle_mouse_events.js',
    'engine/lifecycle_zoom_events.js',
    'engine/lifecycle_crop_drag.js',
    'engine/lifecycle_object_drag.js',
    'engine/lifecycle_mouse_move.js',
    'engine/lifecycle_mouse_up.js',
    'engine/lifecycle_touch_events.js',
    'engine/lifecycle_events.js',
    'engine/save_workspace.js',
    'engine/fullscreen_mode.js',
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
