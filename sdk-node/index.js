const { verifyProofs } = require("./pkg-verifier")

async function verifyNotarizationProof(proof) {
  const notarize_result = JSON.parse(verifyProofs(proof.session_proof, proof.substrings_proof, proof.body_start))
  return notarize_result
}

module.exports = { verifyNotarizationProof }
