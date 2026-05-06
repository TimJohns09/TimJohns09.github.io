(() => {
  const nodeEntry = {
    kind: 'pdf',
    date: 'Jan 2026',
    tags: ['NETWORK'],
    title: 'Privacy Node Build: Running Bitcoin, Monero, and Tor on a $264 Machine',
    desc: 'A build report documenting a low-cost privacy node architecture for running Bitcoin Core, a pruned Monero node, and a Tor Snowflake proxy on compact hardware.',
    file: 'node.pdf',
    url: 'assets/node.pdf'
  };

  if (!entries.some(entry => entry.file === nodeEntry.file)) {
    const merkleIndex = entries.findIndex(entry => entry.file === 'Merkle_Root.pdf');
    entries.splice(merkleIndex + 1, 0, nodeEntry);
  }

  renderFilters();
  renderPapers();
})();
