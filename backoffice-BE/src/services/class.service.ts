import { Transaction } from "../db/index.js";
import { ClassRepository, IClass } from "../repositories/class.repository.js";
import * as dbService from "../db/index.js";

export class ClassService {

  static getOneClassById = async (
    classId: string,
    txInstance?: Transaction
  ): Promise<IClass | null> => {
    const execute = async (tx: Transaction) => {
      return await ClassRepository.getOneById(classId, tx);
    };

    return txInstance
      ? execute(txInstance)
      : dbService.runInTransaction(execute);
  };

}