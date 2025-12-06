import * as dbService from "../../services/db.service";

export function createDbServiceSpies() {
  // Create a mock execute function that we can spy on in our tests.
  const mockExecute = jest.fn();


  const getDbConnectionSpy = jest
    .spyOn(dbService, "getDBConnection")
    .mockImplementation(jest.fn(() =>
  Promise.resolve({
    execute: mockExecute,
  } as any)
));
  return {
    getDbConnectionSpy,
    mockExecute
  };
}

export type DbServiceSpies = ReturnType<typeof createDbServiceSpies>;
