const { verifyNotarizationProof } = require('openlayer-sdk-node')

async function verifyProof(req, res) {
  const proof = req.body.proof

  const notarize_result = verifyNotarizationProof(proof)
  return notarize_result
}

module.exports = { verifyProof }