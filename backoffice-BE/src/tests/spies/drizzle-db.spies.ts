import { mock } from "node:test";
import * as dbService from "../../db";

export function createDrizzleDbSpies() {
  // Build Mock Select chain
  const mockExecute = jest.fn();
  const mockLimit = jest.fn();
  const mockWhere = jest.fn();
  const mockFrom = jest.fn();
  const mockSelect = jest.fn();
  const mockTransaction = jest.fn();

  const mockSelectChain = {
    from: mockFrom,
    where: mockWhere,
    limit: mockLimit,
    execute: mockExecute,
  };

  // Ensure the chain continues
  mockFrom.mockReturnValue(mockSelectChain);
  mockWhere.mockReturnValue(mockSelectChain);
  mockLimit.mockReturnValue(mockSelectChain);

  // Build Mock Insert chain
  const mockValues = jest.fn();
  const mockReturningId = jest.fn();
  const mockInsert = jest.fn();

  const mockInsertChain = {
    values: mockValues,
    $returningId: mockReturningId,
  };

  mockValues.mockReturnValue(mockInsertChain);

  //Build Mock Update Chain
  const mockSet = jest.fn();
  const mockUpdate = jest.fn();

  const mockUpdateChain = {
    set: mockSet,
    where: mockWhere,
    execute: mockExecute,
  };

  mockSet.mockReturnValue(mockUpdateChain);

  const mockDB = {
    select: mockSelect.mockReturnValue(mockSelectChain),
    transaction: mockTransaction,
    insert: mockInsert.mockReturnValue(mockInsertChain),
    update: mockUpdate.mockReturnValue(mockUpdateChain),
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
    mockInsert,
    mockValues,
    mockReturningId,
    mockUpdate,
    mockSet,
    runInTransactionSpy,
    mockTx: mockDB as unknown as dbService.Transaction,
  };
}

export type DbServiceSpies = ReturnType<typeof createDrizzleDbSpies>;
