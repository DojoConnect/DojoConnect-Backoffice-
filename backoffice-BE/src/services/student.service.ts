import { Transaction } from "../db/index.js";
import { StudentRepository } from "../repositories/student.repository.js";
import * as dbService from "../db/index.js";

export class StudentService {
    static getOneStudentByID = async (studentId: string, txInstance?: Transaction) => {
        const execute = async (tx: Transaction) => {
            return await StudentRepository.findOneById(studentId, tx);
        }

        return txInstance
            ? execute(txInstance)
            : dbService.runInTransaction(execute);
    }
}