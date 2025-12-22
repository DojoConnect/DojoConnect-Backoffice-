import { jest, describe, it, expect, afterEach } from "@jest/globals";
import * as dbService from "../../db/index.js";

type SharedFunctions = {
  mockWhere: jest.Mock;
  mockLimit: jest.Mock;
  mockExecute?: jest.Mock;
  mockOrderBy?: jest.Mock;
};

const buildMockSelectChain = ({
  mockWhere,
  mockExecute,
  mockLimit,
  mockOrderBy,
}: SharedFunctions) => {
  const mockFrom = jest.fn();
  const mockSelect = jest.fn();

  const mockSelectChain = {
    from: mockFrom,
    where: mockWhere,
    limit: mockLimit,
    execute: mockExecute,
    mockOrderBy,
  };

  // Ensure the chain continues
  mockFrom.mockReturnValue(mockSelectChain);
  mockLimit.mockReturnValue(mockSelectChain);

  return {
    mockSelect,
    mockFrom,
    mockSelectChain,
  };
};

const buildMockInsertChain = () => {
  const mockValues = jest.fn();
  const mockReturningId = jest.fn();
  const mockInsert = jest.fn();

  const mockInsertChain = {
    values: mockValues,
    $returningId: mockReturningId,
  };

  mockValues.mockReturnValue(mockInsertChain);

  return {
    mockInsert,
    mockValues,
    mockReturningId,
    mockInsertChain,
  };
};

const buildMockUpdateChain = ({ mockLimit, mockWhere }: SharedFunctions) => {
  const mockSet = jest.fn();
  const mockUpdate = jest.fn();

  const mockUpdateChain = {
    set: mockSet,
    where: mockWhere,
    limit: mockLimit,
  };

  mockSet.mockReturnValue(mockUpdateChain);

  return {
    mockUpdate,
    mockSet,
    mockUpdateChain,
  };
};

const buildMockDeleteChain = ({ mockLimit, mockWhere }: SharedFunctions) => {
  const mockDelete = jest.fn();

  const mockDeleteChain = {
    where: mockWhere,
    limit: mockLimit,
  };

  return {
    mockDelete,
    mockDeleteChain,
  };
};

export function createDrizzleDbSpies() {
  const mockExecute = jest.fn();
  const mockWhere = jest.fn();
  const mockLimit = jest.fn();
  const mockOrderBy = jest.fn();

  // Build Mock Where chain
  mockWhere.mockReturnValue({
    orderBy: mockOrderBy,
    execute: mockExecute,
    limit: mockLimit,
  });

  // Build Mock order by chain
  mockOrderBy.mockReturnValue({
    execute: mockExecute,
    limit: mockLimit,
  });

  //Build Mock Update Chain
  const { mockUpdate, mockSet, mockUpdateChain } = buildMockUpdateChain({
    mockWhere,
    mockLimit,
  });

  // Build Mock Select chain
  const { mockSelect, mockFrom, mockSelectChain } = buildMockSelectChain({
    mockExecute,
    mockLimit,
    mockWhere,
    mockOrderBy,
  });

  // Build Mock Insert chain
  const { mockInsert, mockValues, mockReturningId, mockInsertChain } =
    buildMockInsertChain();

  // build Mock Delete Chain
  const { mockDelete, mockDeleteChain } = buildMockDeleteChain({
    mockLimit,
    mockWhere,
  });

  // Mock Transaction
  const mockTransaction = jest.fn();

  const mockDB = {
    select: mockSelect.mockReturnValue(mockSelectChain),
    transaction: mockTransaction,
    insert: mockInsert.mockReturnValue(mockInsertChain),
    update: mockUpdate.mockReturnValue(mockUpdateChain),
    delete: mockDelete.mockReturnValue(mockDeleteChain),
  };

  // Instead of returning mockDB directly, we execute the callback (fn)
  // passing the mockDB as the "transaction" instance.
  mockTransaction.mockImplementation(async (txCallback: any) => {
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
    mockOrderBy,
    mockReturningId,
    mockUpdate,
    mockSet,
    mockDelete,
    runInTransactionSpy,
    mockTx: mockDB as unknown as dbService.Transaction,
  };
}

export type DbServiceSpies = ReturnType<typeof createDrizzleDbSpies>;
