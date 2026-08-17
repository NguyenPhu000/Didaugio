import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { Bell, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui";
import { NOTIFICATION_GROUPS } from "./profileConstants";

export const ProfileNotificationsTab = memo(
  ({ notifSaving, notifSettings, handleNotifToggle }) => {
    const { t } = useTranslation();

    return (
      <div className="bg-white border-2 border-black shadow-sm">
        <div className="bg-black text-white p-4 border-b-2 border-black">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-[#F3E600]" />
              <div>
                <h3 className="tim-meta text-white mb-1 flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  {t("profile.notificationSettings.title")}
                </h3>
                <p className="text-xs text-gray-400 uppercase font-mono">
                  {t("profile.notificationSettings.desc")}
                </p>
              </div>
            </div>
            {notifSaving && (
              <Loader2 className="h-4 w-4 text-[#F3E600] animate-spin" />
            )}
          </div>
        </div>
        <div className="p-6 space-y-6">
          {NOTIFICATION_GROUPS.map((group) => (
            <div key={group.key}>
              <h4 className="font-mono text-xs font-bold uppercase tracking-wider mb-3 text-gray-600">
                {group.title}
              </h4>
              <div className="space-y-2">
                {group.toggles.map(([key, labelKey]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between border border-black px-3 py-2"
                  >
                    <span className="font-mono text-[11px] uppercase">
                      {t(labelKey)}
                    </span>
                    <Checkbox
                      checked={!!notifSettings[group.key]?.[key]}
                      onCheckedChange={(c) =>
                        handleNotifToggle(group.key, key, c === true)
                      }
                      className="rounded-none border-black data-[state=checked]:bg-black data-[state=checked]:text-white"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

ProfileNotificationsTab.displayName = "ProfileNotificationsTab";
export default ProfileNotificationsTab;
