export async function backendRequest(url = '', data = {}) {
  // Default options are marked with *
  const responseJson = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/` + url, {
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    // mode: 'same-origin', // no-cors, *cors, same-origin
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    // credentials: 'same-origin', // include, *same-origin, omit
    headers: {
      'Content-Type': 'application/json'
    },
    redirect: 'follow', // manual, *follow, error
    referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: JSON.stringify(data) // body data type must match "Content-Type" header
  }).then((response) => {
    if (response.status === 200) {
      return response.json(); // parses JSON response into native JavaScript objects
    } else {
      return null  // return null for failed requests
    }
  }).catch((error) => {
    console.log(error)
    return null
  })
  return responseJson
}

export async function postUrl(url = '', data = {}) {
  // Default options are marked with *
  const responseJson = await fetch(url, {
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    headers: {
      'Content-Type': 'application/json'
    },
    redirect: 'follow', // manual, *follow, error
    referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: JSON.stringify(data) // body data type must match "Content-Type" header
  }).then((response) => {
    if (response.status === 200) {
      return response.json(); // parses JSON response into native JavaScript objects
    } else {
      return null  // return null for failed requests
    }
  }).catch((error) => {
    console.log(error)
    return null
  })
  return responseJson
}

export async function getUrl(url = '') {
  // Default options are marked with *
  const responseJson = await fetch(url).then((response) => {
    if (response.status === 200) {
      return response.json(); // parses JSON response into native JavaScript objects
    } else {
      return null  // return null for failed requests
    }
  }).catch((error) => {
    console.log(error)
    return null
  })
  return responseJson
}