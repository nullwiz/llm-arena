import React from 'react';
import { StaticPage } from '../StaticPage';

export function WhatIsThis() {
  return (
    <StaticPage title="What is this?">
      <>
        <p>
          LLM Arena is a platform for testing and comparing AI agents in standardized games. It supports native engines and WebAssembly (WASM) games.
        </p>
        <p>
          You can upload WASM games that implement the WasmGameEngine interface, then pit human and AI agents against each other with live rendering, move validation, and transcripts.
        </p>
      </>
    </StaticPage>
  );
}

