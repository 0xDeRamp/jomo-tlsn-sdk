import { JomoTlsnNotary } from 'jomo-tlsn-sdk/dist';


function ProveNotarization({ notaryFlow }) {
    const revolutServer = "app.revolut.com"

    const buildAuthHeaders = function (response) {
        const cookie = response.headers["Cookie"]
        const deviceId = response.headers["x-device-id"]
        const userAgent = response.headers["User-Agent"]

        const headersWithBearer = new Map([
            ["Cookie", cookie],
            ["X-Device-Id", deviceId],
            ["User-Agent", userAgent],
            ["Host", revolutServer],
        ])
        return headersWithBearer
    }

    const buildDataPathWithResponse = function (response) {
        const account = response["pockets"][0]["id"] || null
        if (!account) {
            return null
        }
        const dataPath = `api/retail/user/current/transactions/last?count=1&internalPocketId=${account}`
        return dataPath
    }

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
                appServer: revolutServer,
                appName: "Revolut",
            }}
            onNotarizationResult={onNotarizationResult}
            defaultNotaryFlowConfigs={{
                defaultNotaryFlow: true,
                buildAuthHeaders: buildAuthHeaders,
                queryPath: "api/retail/user/current/wallet",
                queryMethod: "GET",
                buildDataPathWithResponse: buildDataPathWithResponse,
                dataMethod: "GET",
                keysToNotarize: [["account"], ["amount"], ["category"], ["comment"], ["completeDate"], ["id"], ["state"], ["recipient", "id"], ["recipient", "code"], ["currency"]],
            }}
        />
    )
}

export default ProveNotarization
