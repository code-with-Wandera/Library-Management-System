import Member from "../models/members.model.js";
import fs from "fs";
import csv from "csv-parser";

/**
 * GET all members
 */
export const getMembers = async (req, res) => {
  try {
    const members = await Member.find();
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * ADD single member
 */
export const addMember = async (req, res) => {
  try {
    const { firstName, lastName, email, className } = req.body;

    const member = await Member.create({
      firstName,
      lastName,
      email,
      className,
    });

    res.status(201).json(member);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * IMPORT members from CSV
 * - Validates headers
 * - Skips duplicates (firstName + lastName)
 * - Skips invalid rows
 * - Returns import summary
 */
export const importMembersFromCSV = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const membersToInsert = [];
  const skipped = [];
  const invalid = [];
  const filePath = req.file.path;

  try {
    // Load existing members once
    const existingMembers = await Member.find({}, "firstName lastName");
    const existingSet = new Set(
      existingMembers.map(
        m => `${m.firstName.toLowerCase()}|${m.lastName.toLowerCase()}`
      )
    );

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("headers", (headers) => {
        const requiredHeaders = ["firstName", "lastName"];
        const missing = requiredHeaders.filter(h => !headers.includes(h));

        if (missing.length) {
          fs.unlinkSync(filePath);
          return res
            .status(400)
            .json({ message: `Missing CSV headers: ${missing.join(", ")}` });
        }
      })
      .on("data", (row) => {
        const firstName = row.firstName?.trim();
        const lastName = row.lastName?.trim();

        if (!firstName || !lastName) {
          invalid.push(row);
          return;
        }

        const key = `${firstName.toLowerCase()}|${lastName.toLowerCase()}`;

        if (existingSet.has(key)) {
          skipped.push(row);
          return;
        }

        membersToInsert.push({
          firstName,
          lastName,
          email: row.email || undefined,
          className: row.className || undefined,
        });

        existingSet.add(key); // prevent duplicates within same CSV
      })
      .on("end", async () => {
        try {
          if (membersToInsert.length) {
            await Member.insertMany(membersToInsert);
          }

          fs.unlinkSync(filePath);

          res.json({
            message: "CSV import completed",
            added: membersToInsert.length,
            skipped: skipped.length,
            invalid: invalid.length,
          });
        } catch (err) {
          fs.unlinkSync(filePath);
          res.status(500).json({
            message: "Failed to import members",
            error: err.message,
          });
        }
      })
      .on("error", (err) => {
        fs.unlinkSync(filePath);
        res.status(500).json({
          message: "Failed to process CSV",
          error: err.message,
        });
      });
  } catch (err) {
    fs.unlinkSync(filePath);
    res.status(500).json({ message: err.message });
  }
};
