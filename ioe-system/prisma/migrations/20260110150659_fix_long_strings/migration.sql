-- AlterTable
ALTER TABLE `customer` MODIFY `defaultAddress` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `order` MODIFY `destination` TEXT NOT NULL,
    MODIFY `tags` TEXT NULL;

-- AlterTable
ALTER TABLE `routing` MODIFY `steps` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `shipment` MODIFY `origin` TEXT NOT NULL,
    MODIFY `destination` TEXT NOT NULL;
