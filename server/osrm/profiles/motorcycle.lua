-- OSRM Lua profile for Vietnamese motorcycles
-- Based on car.lua but tuned for motorcycle routing in Vietnam.
-- Key differences from car: lower speeds, narrower roads accessible,
-- ferries critical for Mekong Delta, surface matters more, living streets prioritized.
--
-- OSRM Lua API v4

api_version = 4

local find_access_tag = require("lib/access").find_access_tag
local set_classification = require("lib/guidance").set_classification

-- Speed table (km/h) tuned for Vietnamese road conditions.
-- Vietnam motorcycles average ~25-30 km/h in urban areas.
local default_speed = 28  -- reasonable default for VN urban motorcycle

local speed_table = {
  motorway        = 60,   -- cao toc, xe may duoc phep di
  motorway_link   = 30,
  trunk           = 50,   -- lo lon quoc lo
  trunk_link      = 25,
  primary         = 40,   -- duong loai I
  primary_link    = 20,
  secondary       = 35,   -- duong loai II
  secondary_link  = 17,
  tertiary        = 30,   -- duong loai III
  tertiary_link   = 15,
  unclassified    = 25,   -- duong khong phan loai
  residential     = 20,   -- khu dan cu
  living_street   = 15,   -- hem, ngo - uu tien cho xe may
  service         = 12,   -- hem nho, duong phu
}

-- Roads that motorcycles cannot use.
local excluded_highways = {
  pedestrian = true,
  footway    = true,
  cycleway   = true,
  path       = true,
  steps      = true,
  track      = true,
  bus_guideway = true,
  raceway    = true,
  proposed   = true,
  construction = true,
}

-- Access tag hierarchy: check motorcycle first, then general vehicle tags.
local access_tag_hierarchy = {
  'motorcycle',
  'motor_vehicle',
  'vehicle',
  'access',
}

-- Barriers that motorcycles can pass through.
-- Common in Vietnam: gate, lift_gate, swing_gate at hems and gated communities.
local barrier_whitelist = {
  gate        = true,
  lift_gate   = true,
  swing_gate  = true,
  cattle_grid = true,
  border_control = true,
  toll_booth  = true,
  sally_port  = true,
  entrance    = true,
  yes         = true,  -- generic barrier, motorcycle can usually pass
}

-- Barriers that block motorcycles.
local barrier_blacklist = {
  ['wall']  = true,
  ['fence'] = true,
  ['spikes'] = true,
  ['block'] = true,
  ['bollard'] = true,
}

-- Surface penalty multipliers.
-- Motorcycles are more sensitive to road surface than cars.
local surface_penalties = {
  asphalt    = 1.0,
  concrete   = 1.0,
  paved      = 1.0,
  cement     = 1.0,
  compacted  = 0.9,
  fine_gravel = 0.8,
  unpaved    = 0.7,
  gravel     = 0.6,
  pebblestone = 0.6,
  cobblestone = 0.6,
  sett       = 0.6,
  dirt       = 0.4,
  earth      = 0.4,
  ground     = 0.4,
  grass      = 0.3,
  sand       = 0.3,
  mud        = 0.2,
}

-- Profile table -------------------------------------------------------
local profile = {
  default_mode    = mode.driving,
  default_speed   = default_speed,
  walking_speed   = 5,
  bicycling_speed = 15,

  -- Penalties (seconds)
  traffic_light_penalty   = 5,
  u_turn_penalty          = 20,

  -- Penalty multipliers for way types
  living_street_penalty   = 0.5,  -- prefer hems for motorcycle routing
  service_penalty         = 0.8,

  -- Ferry speed (km/h) -- critical for Mekong Delta / DBSCL
  ferry_speed             = 15,

  -- Use turn restrictions
  use_turn_restrictions   = true,

  -- Sizes (motorcycle is small)
  width                   = 1.0,
  height                  = 2.0,
  length                  = 2.5,
  weight                  = 0.3,
}

function setup()
  return {
    properties = {
      max_speed_for_map_matching        = 60/3.6, -- m/s
      weight_name                       = 'routability',
      process_call_tagless_node         = false,
      u_turn_penalty                    = profile.u_turn_penalty,
      traffic_light_penalty             = profile.traffic_light_penalty,
      continue_straight_at_waypoint     = false,
      mode_change_penalty               = 60,
    },
  }
end

-- Process node --------------------------------------------------------
function process_node(profile, node, result)
  local barrier = node:get_value_by_key('barrier')
  local traffic_lights = node:get_value_by_key('highway')

  -- Handle barriers
  if barrier and barrier ~= '' then
    -- Check blacklist first
    if barrier_blacklist[barrier] then
      result.barrier = true
      return
    end

    -- Check whitelist: allow passage
    if barrier_whitelist[barrier] then
      result.barrier = false
      -- Check access tags on the barrier node itself
      local node_access = node:get_value_by_key('access')
      if node_access == 'no' or node_access == 'private' then
        result.barrier = true
      end
      return
    end

    -- Unknown barrier: block
    result.barrier = true
  end

  -- Handle traffic lights
  if traffic_lights == 'traffic_signals' then
    result.traffic_lights = true
  end
end

-- Process way ---------------------------------------------------------
function process_way(profile, way, result)
  -- 1) Check highway tag
  local highway = way:get_value_by_key('highway')

  -- Handle ferries (critical for Mekong Delta / DBSCL)
  local route = way:get_value_by_key('route')
  if route == 'ferry' then
    result.forward_mode = mode.ferry
    result.backward_mode = mode.ferry
    result.forward_speed = profile.ferry_speed
    result.backward_speed = profile.ferry_speed
    result.name = way:get_value_by_key('name')
    return
  end

  -- Must have a highway tag
  if not highway or highway == '' then
    return
  end

  -- Exclude footways, cycleways, etc.
  if excluded_highways[highway] then
    return
  end

  -- 2) Check access
  local access = find_access_tag(way, access_tag_hierarchy)
  if access == 'no' or access == 'private' then
    return
  end

  -- Explicit motorcycle=no blocks access
  local motorcycle_access = way:get_value_by_key('motorcycle')
  if motorcycle_access == 'no' then
    return
  end

  -- 3) Determine speed
  local speed = speed_table[highway] or default_speed

  -- Apply maxspeed if present
  local maxspeed = tonumber(way:get_value_by_key('maxspeed'))
  if maxspeed and maxspeed > 0 and maxspeed < speed then
    speed = maxspeed
  end

  -- Apply surface penalty
  local surface = way:get_value_by_key('surface')
  if surface and surface_penalties[surface] then
    speed = speed * surface_penalties[surface]
  end

  -- Apply living street / service penalty (prefer hems)
  if highway == 'living_street' then
    speed = speed * profile.living_street_penalty
  elseif highway == 'service' then
    speed = speed * profile.service_penalty
  end

  -- Clamp minimum speed
  if speed < 5 then
    speed = 5
  end

  -- 4) Set speed and mode
  result.forward_speed = speed
  result.backward_speed = speed
  result.forward_mode = profile.default_mode
  result.backward_mode = profile.default_mode

  -- 5) Handle one-way streets
  local oneway = way:get_value_by_key('oneway')
  local junction = way:get_value_by_key('junction')

  if oneway == 'yes' or oneway == '1' or junction == 'roundabout' then
    result.backward_mode = mode.inaccessible
    result.backward_speed = 0
  elseif oneway == '-1' then
    result.forward_mode = mode.inaccessible
    result.forward_speed = 0
  end

  -- 6) Set name for display
  result.name = way:get_value_by_key('name')

  -- 7) Set classification for guidance
  set_classification(highway, result)
end

-- Process turn --------------------------------------------------------
function process_turn(profile, turn)
  -- Base duration penalty
  if turn.has_traffic_light then
    turn.duration = turn.duration + profile.traffic_light_penalty
  end

  -- U-turn penalty
  if turn.is_u_turn then
    turn.duration = turn.duration + profile.u_turn_penalty
  end
end

return profile
