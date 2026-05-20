-- OSRM Lua profile for Vietnamese motorcycles
-- Based on car.lua but tuned for motorcycle routing in Vietnam.
-- Key differences from car: lower speeds, narrower roads accessible,
-- ferries critical for Mekong Delta, surface matters more, living streets prioritized.

api_version = 4

Set = require('lib/set')
Sequence = require('lib/sequence')
Handlers = require("lib/way_handlers")
Relations = require("lib/relations")
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
      continue_straight_at_waypoint     = true,
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

    service_access_tag_blacklist = Set {
      'private',
    },

    -- Tags that indicate access for motorcycles specifically
    access_tags_hierarchy = Sequence {
      'motorcycle',
      'motor_vehicle',
      'vehicle',
      'access',
    },

    -- Tags for turn restrictions
    turn_restrictions = Sequence {
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

    -- Surface penalties: motorcycles sensitive to road surface
    surface_penalties = {
      asphalt    = 1.0,
      concrete   = 1.0,
      paved      = 1.0,
      compacted  = 0.9,
      fine_gravel = 0.8,
      unpaved    = 0.7,
      gravel     = 0.6,
      cobblestone = 0.6,
      sett       = 0.6,
      dirt       = 0.4,
      earth      = 0.4,
      ground     = 0.4,
      grass      = 0.3,
      sand       = 0.3,
      mud        = 0.2,
    },

    -- Prefer living streets (hems) for motorcycle
    living_street_penalty = 0.5,
    service_penalty       = 0.8,

    -- Ferry speed (critical for Mekong Delta / DBSCL)
    ferry_speed = 15,

    -- Penalty for highway classes
    highway_penalty = {
      motorway      = 0.5,
      trunk         = 0.6,
      primary       = 0.7,
      secondary     = 0.8,
      tertiary      = 0.9,
      residential   = 1.0,
      living_street = 1.2,  -- prefer: higher = more preferred
      service       = 1.1,
    },

    -- Ignore certain areas
    ignore_areas = Set {
      'parking_aisle',
    },
  }
end

-- Process node --------------------------------------------------------
function process_node(profile, node, result)
  local barrier = node:get_value_by_key("barrier")
  local traffic_lights = node:get_value_by_key("highway")

  -- Handle barriers
  if barrier and barrier ~= '' then
    if profile.barrier_whitelist[barrier] then
      result.barrier = false
    else
      result.barrier = true
    end
  end

  -- Handle traffic lights
  if traffic_lights == 'traffic_signals' then
    result.traffic_lights = true
  end
end

-- Process way ---------------------------------------------------------
function process_way(profile, way, result)
  local highway = way:get_value_by_key("highway")

  -- Handle ferries (critical for Mekong Delta / DBSCL)
  local route = way:get_value_by_key("route")
  if route == 'ferry' then
    result.forward_mode = mode.ferry
    result.backward_mode = mode.ferry
    result.forward_speed = profile.ferry_speed
    result.backward_speed = profile.ferry_speed
    result.name = way:get_value_by_key("name")
    return
  end

  -- Must have a highway tag
  if not highway or highway == '' then
    return
  end

  -- Check access
  local access = find_access_tag(way, profile.access_tags_hierarchy)
  if access and profile.access_tag_blacklist[access] then
    return
  end

  -- Explicit motorcycle=no blocks access
  local motorcycle_access = way:get_value_by_key("motorcycle")
  if motorcycle_access == 'no' then
    return
  end

  -- Determine speed from table
  local speed = profile.speeds[highway] or profile.default_speed

  -- Apply maxspeed if present
  local maxspeed = limit.parse(way:get_value_by_key("maxspeed"))
  if maxspeed and maxspeed > 0 and maxspeed < speed then
    speed = maxspeed
  end

  -- Apply surface penalty
  local surface = way:get_value_by_key("surface")
  if surface and profile.surface_penalties[surface] then
    speed = speed * profile.surface_penalties[surface]
  end

  -- Apply living street / service penalty (prefer hems for motorcycle)
  if highway == 'living_street' then
    speed = speed * profile.living_street_penalty
  elseif highway == 'service' then
    speed = speed * profile.service_penalty
  end

  -- Clamp minimum speed
  if speed < 5 then
    speed = 5
  end

  -- Set speed and mode
  result.forward_speed = speed
  result.backward_speed = speed
  result.forward_mode = profile.default_mode
  result.backward_mode = profile.default_mode

  -- Handle one-way streets
  local oneway = way:get_value_by_key("oneway")
  local junction = way:get_value_by_key("junction")

  if oneway == 'yes' or oneway == '1' or junction == 'roundabout' then
    result.backward_mode = mode.inaccessible
    result.backward_speed = 0
  elseif oneway == '-1' then
    result.forward_mode = mode.inaccessible
    result.forward_speed = 0
  end

  -- Set name for display
  result.name = way:get_value_by_key("name")

  -- Set road classification for guidance
  set_classification(highway, result)
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
