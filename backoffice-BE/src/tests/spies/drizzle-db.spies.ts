import * as dbService from "../../db";

export function createDrizzleDbSpies() {
  // Create a mock execute function that we can spy on in our tests.

  const mockExecute = jest.fn();
  const mockLimit = jest.fn();
  const mockWhere = jest.fn();
  const mockFrom = jest.fn();
  const mockSelect = jest.fn();
  const mockTransaction = jest.fn();

  const mockChain = {
    from: mockFrom,
    where: mockWhere,
    limit: mockLimit,
    execute: mockExecute,
  };

  // Ensure the chain continues
  mockFrom.mockReturnValue(mockChain);
  mockWhere.mockReturnValue(mockChain);
  mockLimit.mockReturnValue(mockChain);

  const mockDB = {
    select: mockSelect.mockReturnValue(mockChain),
    transaction: mockTransaction,
  };

  // Instead of returning mockDB directly, we execute the callback (fn)
  // passing the mockDB as the "transaction" instance.
  mockTransaction.mockImplementation(async (txCallback) => {
    return await txCallback(mockDB);
  });

  const getDbSpy = jest
    .spyOn(dbService, "getDB")
    .mockReturnValue(mockDB as any);

  const runInTransactionSpy = jest
    .spyOn(dbService, "runInTransaction")
    .mockImplementation(async (txCallback) => {
      return await txCallback(mockDB as any);
    });


  return {
    mockDB,
    getDbSpy,
    mockExecute,
    mockSelect,
    mockFrom,
    mockWhere,
    mockLimit,
    runInTransactionSpy,
    mockTx: mockDB as unknown as dbService.Transaction,
  };
}

export type DbServiceSpies = ReturnType<typeof createDrizzleDbSpies>;
