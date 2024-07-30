import CoinbaseUserNewSdk from "./notarization/CoinbaseUserNewSdk"
import LinkedInConnectionsNewSdk from "./notarization/LinkedInConnectionsNewSdk"
import RevolutLastPaymentNewSdk from "./notarization/RevolutLastPaymentNewSdk"
import RobinhoodRoi from "./notarization/RobinhoodRoi"
import Venmo from "./notarization/Venmo"


function ProveNotarization({ notaryFlow }) {

    return (
        <>
            {notaryFlow && notaryFlow.flow_id === "revolut_last_payment" &&
                <RevolutLastPaymentNewSdk />
            }
            {notaryFlow && notaryFlow.flow_id === "coinbase_user" &&
                <CoinbaseUserNewSdk />
            }
            {notaryFlow && notaryFlow.flow_id === "linkedin_connections" &&
                <LinkedInConnectionsNewSdk />
            }
            {notaryFlow && notaryFlow.flow_id === "robinhood_roi" &&
                <RobinhoodRoi />
            }
            {notaryFlow && notaryFlow.flow_id === "venmo" &&
                <Venmo />
            }
        </>
    )
}

export default ProveNotarization
