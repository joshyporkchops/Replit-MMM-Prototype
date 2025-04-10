import { pgTable, text, serial, integer, boolean, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// MMM Onboarding Schemas

export const onboardingData = pgTable("onboarding_data", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  step: text("step").notNull().default("welcome"),
  primaryKpi: text("primary_kpi"),
  secondaryKpis: text("secondary_kpis").array(),
  uploadMethod: text("upload_method"),
  dataStatus: text("data_status"),
  externalFactors: json("external_factors"),
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOnboardingDataSchema = createInsertSchema(onboardingData).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOnboardingData = z.infer<typeof insertOnboardingDataSchema>;
export type OnboardingData = typeof onboardingData.$inferSelect;

export const uploadedFiles = pgTable("uploaded_files", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimetype: text("mimetype").notNull(),
  size: integer("size").notNull(),
  path: text("path").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUploadedFileSchema = createInsertSchema(uploadedFiles).omit({
  id: true,
  createdAt: true,
});

export type InsertUploadedFile = z.infer<typeof insertUploadedFileSchema>;
export type UploadedFile = typeof uploadedFiles.$inferSelect;

export const integrations = pgTable("integrations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull().default("connected"),
  config: json("config"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertIntegrationSchema = createInsertSchema(integrations).omit({
  id: true,
  createdAt: true,
});

export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;
export type Integration = typeof integrations.$inferSelect;

// Validation schemas for onboarding steps

export const primaryKpiSchema = z.object({
  primaryKpi: z.string().min(1, "Primary KPI is required"),
});

export const secondaryKpisSchema = z.object({
  secondaryKpis: z.array(z.string()).max(3, "Maximum 3 secondary KPIs allowed"),
});

export const uploadMethodSchema = z.object({
  uploadMethod: z.enum(["manual", "integration"], {
    required_error: "Upload method is required",
  }),
});

export const externalFactorsSchema = z.object({
  factors: z.array(
    z.object({
      type: z.string(),
      name: z.string(),
      enabled: z.boolean(),
      settings: z.any().optional(),
    })
  ),
});

export const onboardingStepSchema = z.object({
  step: z.enum(["welcome", "objectives", "upload", "analyze", "factors", "review", "complete"]),
});

export const dataValidationResponseSchema = z.object({
  status: z.enum(["analyzing", "success", "error"]),
  errors: z.array(z.object({
    row: z.number(),
    column: z.string(),
    message: z.string()
  })).optional(),
  summary: z.object({
    timePeriod: z.string().optional(),
    dataPoints: z.number().optional(),
    channels: z.number().optional()
  }).optional(),
  preview: z.array(z.record(z.string(), z.any())).optional(),
  columns: z.array(z.string()).optional()
});

export type DataValidationResponse = z.infer<typeof dataValidationResponseSchema>;

// KPI Options for selection
export const kpiOptions = {
  primary: [
    { id: "purchase", name: "Purchase", description: "Completed transactions that generate revenue" },
    { id: "app_install", name: "App Install", description: "New application installations" },
    { id: "sign_up", name: "Sign Up", description: "New user registrations and account creations" }
  ],
  secondary: [
    { id: "add_to_cart", name: "Add to Cart", description: "Items added to shopping cart" },
    { id: "view_product", name: "View Product", description: "Product page views" },
    { id: "search", name: "Search", description: "Search queries performed" },
    { id: "tutorial_complete", name: "Tutorial Complete", description: "Users who completed onboarding tutorials" },
    { id: "level_complete", name: "Level Complete", description: "Users completing game levels" },
    { id: "reward_unlocked", name: "Reward Unlocked", description: "Achievement or reward milestones reached" },
    { id: "rating", name: "Rating", description: "User ratings or reviews submitted" }
  ]
};

// Integration options
export const integrationOptions = [
  { id: "google-ads", name: "Google Ads", description: "Connect your Google Ads account to import campaign performance data.", icon: "google" },
  { id: "facebook-ads", name: "Facebook Ads", description: "Import your Meta Ads data including Facebook and Instagram campaigns.", icon: "meta" },
  { id: "tiktok-ads", name: "TikTok Ads", description: "Connect and import campaign data from your TikTok Ads account.", icon: "tiktok" },
  { id: "linkedin-ads", name: "LinkedIn Ads", description: "Import your LinkedIn advertising campaign performance data.", icon: "linkedin" },
  { id: "twitter-ads", name: "Twitter Ads", description: "Connect and import your Twitter advertising campaign data.", icon: "twitter" },
  { id: "snapchat-ads", name: "Snapchat Ads", description: "Import your Snapchat advertising campaign performance data.", icon: "snapchat" }
];

// External factor options
export const externalFactorCategories = [
  {
    id: "seasonality",
    name: "Seasonality & Weather",
    factors: [
      { id: "seasons", name: "Seasons", description: "Account for seasonal patterns in consumer behavior" },
      { id: "weather", name: "Weather Events", description: "Include major weather events that affected your business" }
    ]
  },
  {
    id: "events",
    name: "Events & Holidays",
    factors: [
      { id: "holidays", name: "Holidays", description: "Include key holidays that affect your business" },
      { id: "major-events", name: "Major Events", description: "Include significant global or local events" }
    ]
  },
  {
    id: "economic",
    name: "Economic Factors",
    factors: [
      { id: "economic-indicators", name: "Economic Indicators", description: "Include economic factors that may impact consumer behavior" }
    ]
  },
  {
    id: "competitive",
    name: "Competitive Activity",
    factors: [
      { id: "competitor-campaigns", name: "Competitor Campaigns", description: "Track major competitor marketing initiatives" }
    ]
  }
];
