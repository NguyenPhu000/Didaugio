-- OSRM Lua profile for Vietnamese motorcycles
-- Based on car.lua but tuned for motorcycle routing in Vietnam.
-- Key differences from car: lower speeds, narrower roads accessible,
-- ferries critical for Mekong Delta, surface matters more, living streets prioritized.

api_version = 4

Set = require('lib/set')
Sequence = require('lib/sequence')
Handlers = require("lib/way_handlers")
Relations = require("lib/relations")
Obstacles = require("lib/obstacles")
find_access_tag = require("lib/access").find_access_tag
set_classification = require("lib/guidance").set_classification
limit = require("lib/maxspeed").limit
Utils = require("lib/utils")
Measure = require("lib/measure")

function setup()
  return {
    properties = {
      max_speed_for_map_matching        = 180/3.6,
      weight_name                       = 'routability',
      process_call_tagless_node         = false,
      u_turn_penalty                    = 20,
      traffic_light_penalty             = 5,
      continue_straight_at_waypoint     = false,
      use_turn_restrictions             = true,
      left_hand_driving                 = false,
    },

    default_mode              = mode.driving,
    default_speed             = 28,  -- km/h, reasonable for VN motorcycle
    oneway_handling           = true,
    side_road_multiplier      = 0.8,
    turn_penalty              = 7.5,
    speed_reduction           = 0.8,
    turn_bias                 = 1.075,
    lane_markings_penalty     = 0.8,

    -- Vehicle size (motorcycle is small)
    vehicle_height = 1.5,
    vehicle_width  = 0.8,
    vehicle_length = 2.0,
    vehicle_weight = 150,

    -- Barrier whitelist: common in Vietnam (gates at hems, gated communities)
    barrier_whitelist = Set {
      'cattle_grid',
      'border_control',
      'toll_booth',
      'gate',
      'lift_gate',
      'swing_gate',
      'entrance',
      'exit',
    },

    -- Access tags: motorcycle can use motorcar/motor_vehicle roads
    access_tag_whitelist = Set {
      'yes',
      'motorcar',
      'motor_vehicle',
      'vehicle',
      'permissive',
      'designated',
      'destination',
    },

    access_tag_blacklist = Set {
      'no',
      'agricultural',
      'forestry',
      'emergency',
      'psv',
      'customers',
      'private',
    },

    restricted_access_tag_list = Set {
      'private',
      'destination',
      'customers',
    },

    restricted_highway_whitelist = Set {
      'motorway',
      'motorway_link',
      'trunk',
      'trunk_link',
      'primary',
      'primary_link',
      'secondary',
      'secondary_link',
      'tertiary',
      'tertiary_link',
      'residential',
    },

    service_access_tag_blacklist = Set {
      'private',
    },

    service_tag_forbidden = Set {
      'emergency_access',
    },

    -- Tags that indicate access for motorcycles specifically
    access_tags_hierarchy = Sequence {
      'motorcycle',
      'motor_vehicle',
      'vehicle',
      'access',
    },

    -- Tags for turn restrictions
    restrictions = Sequence {
      'motorcycle',
      'motor_vehicle',
      'vehicle',
    },

    -- Speed table (km/h) tuned for Vietnamese road conditions
    speeds = Sequence {
      highway = {
        motorway        = 60,
        motorway_link   = 30,
        trunk           = 50,
        trunk_link      = 25,
        primary         = 40,
        primary_link    = 20,
        secondary       = 35,
        secondary_link  = 17,
        tertiary        = 30,
        tertiary_link   = 15,
        unclassified    = 25,
        residential     = 20,
        living_street   = 15,
        service         = 12,
        track           = 10,
        path            = 8,
      },
    },

    -- Service road penalties
    service_penalties = {
      alley          = 0.5,
      parking        = 0.5,
      parking_aisle  = 0.5,
      driveway       = 0.5,
      ["drive-through"] = 0.5,
      ["drive-thru"]    = 0.5,
    },

    -- Surface speeds (km/h) - motorcycles sensitive to road surface
    surface_speeds = {
      asphalt           = nil,  -- no limit
      concrete          = nil,
      ["concrete:plates"] = nil,
      ["concrete:lanes"]  = nil,
      paved             = nil,
      cement            = 80,
      compacted         = 80,
      fine_gravel       = 80,
      paving_stones     = 60,
      metal             = 60,
      bricks            = 60,
      grass             = 40,
      wood              = 40,
      sett              = 40,
      grass_paver       = 40,
      gravel            = 40,
      unpaved           = 40,
      ground            = 40,
      dirt              = 40,
      pebblestone       = 40,
      tartan            = 40,
      cobblestone       = 30,
      clay              = 30,
      earth             = 20,
      stone             = 20,
      rocky             = 20,
      sand              = 20,
      mud               = 10,
    },

    tracktype_speeds = {
      grade1 = 60,
      grade2 = 40,
      grade3 = 30,
      grade4 = 25,
      grade5 = 20,
    },

    smoothness_speeds = {
      intermediate    = 80,
      bad             = 40,
      very_bad        = 20,
      horrible        = 10,
      very_horrible   = 5,
      impassable      = 0,
    },

    -- Route speeds (ferries)
    route_speeds = {
      ferry = 15,
      shuttle_train = 10,
    },

    -- Bridge speeds
    bridge_speeds = {
      movable = 5,
    },

    -- Maxspeed tables
    maxspeed_table_default = {
      urban   = 50,
      rural   = 90,
      trunk   = 110,
      motorway = 130,
    },

    maxspeed_table = {
    },

    -- Classes
    classes = Sequence {
      'toll',
      'motorway',
      'ferry',
      'restricted',
      'tunnel',
    },

    -- Excludable
    excludable = Set {
      'toll',
      'motorway',
      'ferry',
    },

    -- Avoid set
    avoid = Set {
      'area',
      'reversible',
      'impassable',
      'steps',
      'construction',
      'proposed',
    },

    -- Construction whitelist
    construction_whitelist = Set {
      'no',
      'minor',
    },

    -- Prefetch tags
    prefetch = Set {
      'highway',
      'bridge',
      'route',
    },

    -- Relation types
    relation_types = Sequence {
      "route",
    },

    -- Turn classification
    highway_turn_classification = {},
    access_turn_classification = {},
  }
end

-- Process node --------------------------------------------------------
function process_node(profile, node, result)
  local barrier = node:get_value_by_key("barrier")
  local highway = node:get_value_by_key("highway")

  -- Handle barriers
  if barrier and barrier ~= '' then
    local access = find_access_tag(node, profile.access_tags_hierarchy)
    if access then
      if profile.access_tag_blacklist[access] and
         not profile.restricted_access_tag_list[access] then
        result.barrier = true
      end
    else
      local barrier_whitelist = profile.barrier_whitelist
      if not barrier_whitelist[barrier] then
        result.barrier = true
      end
    end
  end

  -- Handle traffic lights
  if highway == 'traffic_signals' then
    result.traffic_lights = true
  end
end

-- Process way ---------------------------------------------------------
function process_way(profile, way, result, relations)
  local data = {
    highway = way:get_value_by_key('highway'),
    bridge = way:get_value_by_key('bridge'),
    route = way:get_value_by_key('route'),
  }

  -- Early exit: must have highway or route tag
  if (not data.highway or data.highway == '') and
     (not data.route or data.route == '')
  then
    return
  end

  -- Initialize speed to -1 so WayHandlers.speed knows to set it
  result.forward_speed = -1
  result.backward_speed = -1

  -- Build handler pipeline (same as car.lua, adapted for motorcycle)
  local handlers = Sequence {
    Handlers.default_mode,
    Handlers.blocked_ways,
    Handlers.avoid_ways,
    Handlers.handle_height,
    Handlers.handle_width,
    Handlers.handle_length,
    Handlers.handle_weight,
    Handlers.access,
    Handlers.oneway,
    Handlers.destinations,
    Handlers.ferries,
    Handlers.movables,
    Handlers.service,
    Handlers.speed,
    Handlers.maxspeed,
    Handlers.surface,
    Handlers.penalties,
    Handlers.classes,
    Handlers.turn_lanes,
    Handlers.classification,
    Handlers.roundabouts,
    Handlers.startpoint,
    Handlers.driving_side,
    Handlers.names,
    Handlers.weights,
    Handlers.way_classification_for_turn,
  }

  Handlers.run(profile, way, result, data, handlers, relations)
end

-- Process turn --------------------------------------------------------
function process_turn(profile, turn)
  -- Traffic light penalty
  if turn.has_traffic_light then
    turn.duration = turn.duration + 5
  end

  -- U-turn penalty
  if turn.is_u_turn then
    turn.duration = turn.duration + 20
  end
end

return {
  setup = setup,
  process_node = process_node,
  process_way = process_way,
  process_turn = process_turn,
}
