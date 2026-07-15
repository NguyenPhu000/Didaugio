const VIEWPORT_NUMBER_FIELDS = ["west", "south", "east", "north", "zoom"];

export const isValidMapViewport = (viewport) =>
  Boolean(
    viewport &&
      VIEWPORT_NUMBER_FIELDS.every((field) =>
        Number.isFinite(Number(viewport[field])),
      ),
  );
