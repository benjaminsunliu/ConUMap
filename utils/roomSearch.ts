export function normalizeSearchToken(value: string) {
  return value.toUpperCase().replaceAll(/[^A-Z0-9]/g, "");
}

export function getRoomSearchTokens(roomQuery: string, buildingCode: string) {
  const normalizedRoom = normalizeSearchToken(roomQuery);
  if (!normalizedRoom) {
    return [];
  }

  const normalizedBuildingCode = normalizeSearchToken(buildingCode);
  const normalizedRoomWithCode = normalizedRoom.startsWith(normalizedBuildingCode)
    ? normalizedRoom
    : `${normalizedBuildingCode}${normalizedRoom}`;

  return [...new Set([normalizedRoom, normalizedRoomWithCode])];
}

export function getRoomTokens(room: string, buildingCode: string) {
  const normalizedRoom = normalizeSearchToken(room);
  const normalizedBuildingCode = normalizeSearchToken(buildingCode);
  const withoutBuildingCode = normalizedRoom.startsWith(normalizedBuildingCode)
    ? normalizedRoom.slice(normalizedBuildingCode.length)
    : normalizedRoom;
  return [...new Set([normalizedRoom, withoutBuildingCode].filter(Boolean))];
}

export function buildRoomLookup(roomSuggestions: string[], buildingCode: string) {
  const roomLookup = new Map<string, string>();
  const normalizedSuggestions = [
    ...new Set(roomSuggestions.map((room) => room.trim())),
  ].filter(Boolean);

  normalizedSuggestions.forEach((room) => {
    getRoomTokens(room, buildingCode).forEach((token) => {
      if (!roomLookup.has(token)) {
        roomLookup.set(token, room);
      }
    });
  });

  return roomLookup;
}

export function resolveCanonicalRoom(
  roomQuery: string,
  buildingCode: string,
  roomLookup: Map<string, string>,
) {
  const roomTokens = getRoomSearchTokens(roomQuery, buildingCode);
  if (roomTokens.length === 0) {
    return undefined;
  }

  const matchedToken = roomTokens.find((token) => roomLookup.has(token));
  if (!matchedToken) {
    return undefined;
  }

  return roomLookup.get(matchedToken);
}
