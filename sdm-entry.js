(() => {
  const sdmEntry = {
    kind: 'pdf',
    date: 'Jan 2026',
    tags: ['MALWARE', 'AI/ML'],
    title: 'Malware Obfuscation using Kanerva’s Sparse Distributed Memory',
    desc: 'A research paper exploring how Sparse Distributed Memory-style encoding and retrieval can be adapted as a malware obfuscation strategy, distributing payload bytes across memory locations and reconstructing them only at runtime.',
    file: 'sdm_obfuscation.pdf',
    url: 'assets/sdm_obfuscation.pdf'
  };

  if (!entries.some(entry => entry.file === sdmEntry.file)) {
    const merkleIndex = entries.findIndex(entry => entry.file === 'Merkle_Root.pdf');
    entries.splice(merkleIndex + 1, 0, sdmEntry);
  }

  renderFilters();
  renderPapers();
})();
