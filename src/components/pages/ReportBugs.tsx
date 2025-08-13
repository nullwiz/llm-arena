import React from 'react';
import { StaticPage } from '../StaticPage';

export function ReportBugs() {
  return (
    <StaticPage title="Report Bugs">
      <>
        <p>
          Found a bug? Please report it so we can fix it quickly. Use our GitHub issues page:
        </p>
        <p>
          <a className="text-gray-300 hover:underline" href="https://github.com/nullwiz/llm-arena/issues" target="_blank" rel="noreferrer">Open GitHub Issues</a>
        </p>
        <p className="text-gray-400">
          Include steps to reproduce, expected/actual behavior, and screenshots if possible.
        </p>
      </>
    </StaticPage>
  );
}

