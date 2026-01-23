import Member from "../models/member.model.js";
import fs from "fs";
import csv from "csv-parser";

/**
 * POST import members from CSV
 * Validates headers, skips duplicates, reports results
 */
export const importMembers = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const membersToInsert = [];
  const skipped = [];
  const invalid = [];
  const filePath = req.file.path;

  // Read existing members once to check duplicates
  const existingMembers = await Member.find({}, "firstName lastName");
  const existingSet = new Set(
    existingMembers.map(m => `${m.firstName.toLowerCase()}|${m.lastName.toLowerCase()}`)
  );

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("headers", (headers) => {
      const requiredHeaders = ["firstName", "lastName"];
      const missing = requiredHeaders.filter(h => !headers.includes(h));
      if (missing.length) {
        fs.unlinkSync(filePath);
        return res.status(400).json({ message: `Missing CSV headers: ${missing.join(", ")}` });
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

      membersToInsert.push({ firstName, lastName });
      existingSet.add(key); // prevent duplicates within same CSV
    })
    .on("end", async () => {
      try {
        if (membersToInsert.length > 0) {
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
        res.status(500).json({ message: "Failed to import members", error: err.message });
      }
    })
    .on("error", (err) => {
      fs.unlinkSync(filePath);
      res.status(500).json({ message: "Failed to process CSV", error: err.message });
    });
};
