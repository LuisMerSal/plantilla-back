-- AlterTable
ALTER TABLE "banners" ADD COLUMN     "is_button_action" BOOLEAN DEFAULT false,
ADD COLUMN     "redirect_url" VARCHAR(255);
