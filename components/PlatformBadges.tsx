type PlatformBadgesProps = {
  platforms: string[];
};

export default function PlatformBadges({ platforms }: PlatformBadgesProps) {
  if (platforms.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {platforms.map((platform) => (
        <span key={platform} className="chip">
          {platform}
        </span>
      ))}
    </div>
  );
}
