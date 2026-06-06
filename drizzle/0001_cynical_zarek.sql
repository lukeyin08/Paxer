DROP INDEX "benchmarks_code_region_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "benchmarks_code_region_idx" ON "benchmarks" USING btree ("cpt_hcpcs_code","region");