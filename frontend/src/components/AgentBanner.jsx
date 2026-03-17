import { useState, useEffect, useCallback } from 'react';

export default function AgentBanner() {
  const [skillsContent, setSkillsContent] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/skills.md')
      .then((r) => r.text())
      .then(setSkillsContent)
      .catch(() => {});
  }, []);

  const handleCopy = useCallback(() => {
    if (!skillsContent) return;
    navigator.clipboard.writeText(skillsContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [skillsContent]);

  return (
    <div className="agent-banner">
      <span className="agent-banner-label">[AGENTS WELCOME]</span>
      <span className="agent-banner-text">THIS GAME IS AGENT-NATIVE.</span>
      <a
        href="/skills.md"
        target="_blank"
        rel="noopener noreferrer"
        className="agent-banner-link"
      >
        SKILLS.MD
      </a>
      <button className="agent-banner-copy" onClick={handleCopy}>
        {copied ? '[COPIED \u2713]' : '[COPY]'}
      </button>
    </div>
  );
}
