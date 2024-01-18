import { JomoTlsnNotary } from 'jomo-tlsn-sdk/dist';


function ProveNotarization({ notaryFlow }) {

    const onNotarizationResult = async function (res) {
        console.log(res)
    }

    return (
        <JomoTlsnNotary
            notaryServers={{
                notaryServerHost: "127.0.0.1:7047",
                notaryServerSsl: false,
                websockifyServer: "ws://127.0.0.1:61289",
            }}
            extensionConfigs={{
                redirectUrl: "https://app.revolut.com/home",
                urlFilters: ["https://app.revolut.com/api/retail/user/current/wallet"],
            }}
            applicationConfigs={{
                appServer: "app.revolut.com",
                appName: "Revolut",
            }}
            onNotarizationResult={onNotarizationResult}
        />
    )
}

export default ProveNotarization
