import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { Mock, MockInstance } from "vitest";

import * as dbService from "../../db/index.js";

type SharedFunctions = {
  mockWhere: Mock;
  mockLimit: Mock;
  mockExecute?: Mock;
  mockOrderBy?: Mock;
};

const buildMockSelectChain = ({
  mockWhere,
  mockExecute,
  mockLimit,
  mockOrderBy,
}: SharedFunctions) => {
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();

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
  const mockValues = vi.fn();
  const mockReturningId = vi.fn();
  const mockInsert = vi.fn();

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
  const mockSet = vi.fn();
  const mockUpdate = vi.fn();

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
  const mockDelete = vi.fn();

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
  const mockExecute = vi.fn();
  const mockWhere = vi.fn();
  const mockLimit = vi.fn();
  const mockOrderBy = vi.fn();

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
  const { mockInsert, mockValues, mockReturningId, mockInsertChain } = buildMockInsertChain();

  // build Mock Delete Chain
  const { mockDelete, mockDeleteChain } = buildMockDeleteChain({
    mockLimit,
    mockWhere,
  });

  // Mock Transaction
  const mockTransaction = vi.fn();

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

  const getDbSpy = vi.spyOn(dbService, "getDB").mockReturnValue(mockDB as any);

  const runInTransactionSpy = vi
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
