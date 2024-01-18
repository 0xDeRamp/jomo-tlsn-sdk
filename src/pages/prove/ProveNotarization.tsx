import RevolutLastPayment from "./notarization/RevolutLastPayment"
import RobinhoodRoi from "./notarization/RobinhoodRoi"
import Venmo from "./notarization/Venmo"


function ProveNotarization({ notaryFlow }) {

    return (
        <>
            {notaryFlow && notaryFlow.flow_id === "revolut_last_payment" &&
                <RevolutLastPayment />
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
