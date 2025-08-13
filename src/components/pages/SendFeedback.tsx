import React from 'react';
import { StaticPage } from '../StaticPage';

export function SendFeedback() {
  return (
    <StaticPage title="Send Feedback">
      <>
        <p>
          Have ideas or suggestions? Open an issue on our GitHub or email me at marcoiurman@gmail.com.
        </p>
        <ul className="list-disc pl-6 text-gray-400">
          <li>Feature requests</li>
          <li>UI/UX improvements</li>
          <li>New games you’d like to see</li>
        </ul>
      </>
    </StaticPage>
  );
}

