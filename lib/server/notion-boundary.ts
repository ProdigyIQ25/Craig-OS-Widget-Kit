import "server-only";

export type NotionServerConfiguration = {
  configured: boolean;
  workspaceConfigured: boolean;
};

/** Server-only presence check. Credential values must never leave this module. */
export function getNotionServerConfiguration(): NotionServerConfiguration {
  return {
    configured: Boolean(process.env.NOTION_TOKEN),
    workspaceConfigured: Boolean(process.env.NOTION_WORKSPACE_ID)
  };
}
