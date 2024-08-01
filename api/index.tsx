import { Button, Frog } from 'frog'
import { handle } from 'frog/vercel'
import { neynar } from 'frog/middlewares'
import { Box, Image, Heading, Text, VStack, Spacer, vars } from "../lib/ui.js";
import { storageRegistry } from "../lib/contracts.js";
import { createGlideClient, Chains, CurrenciesByChain } from "@paywithglide/glide-js";
import { encodeFunctionData, hexToBigInt, toHex } from 'viem';
import dotenv from 'dotenv';

// Uncomment this packages to tested on local server
import { devtools } from 'frog/dev';
import { serveStatic } from 'frog/serve-static';

// Load environment variables from .env file
dotenv.config();

// Define an in-memory cache object
const cache: Record<string, any> = {};

// Function to retrieve data from cache
async function getFromCache(key: string) {
    return cache[key];
}

// Function to cache data
async function cacheData(key: string, data: any) {
    cache[key] = data;
}

export const glideClient = createGlideClient({
  projectId: process.env.GLIDE_PROJECT_ID,
 
  // Lists the chains where payments will be accepted
  chains: [Chains.Arbitrum, Chains.Optimism],
});

const baseUrl = "https://warpcast.com/~/compose";
const text = "FC Storage Gift 💾\nFrame by @0x94t3z.eth";
const embedUrl = "https://fc-storage-gift.vercel.app/api/frame";
const logo = "https://raw.githubusercontent.com/Mr94t3z/fc-storage-gift/master/public/images/arb.png";

const CAST_INTENS = `${baseUrl}?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(embedUrl)}`;

export const app = new Frog({
  assetsPath: '/',
  basePath: '/api/frame',
  ui: { vars },
  browserLocation: CAST_INTENS,
  imageAspectRatio: '1.91:1',
  title: 'Farcaster Storage Gift',
}).use(
  neynar({
    apiKey: process.env.NEYNAR_API_KEY || '',
    features: ['interactor', 'cast'],
  }),
)

// Initialize total pages and current page
const itemsPerPage = 1;
let totalPages = 0;
let currentPage = 1;

// Neynar API base URL
const baseUrlNeynarV2 = process.env.BASE_URL_NEYNAR_V2;

// Initial frame
app.frame('/', (c) => {
  return c.res({
    image: (
      <Box
          grow
          alignVertical="center"
          backgroundColor="black"
          padding="48"
          textAlign="center"
          height="48"
        >
          <VStack gap="4">
              <Box flexDirection="row">
                <Image
                    height="24"
                    objectFit="cover"
                    src="/images/arb.png"
                  />
                <Spacer size="10" />
                <Text color="tosca" decoration="underline" align="center" size="14">
                  Arbitrum One
                </Text>
              </Box>
              <Spacer size="16" />
              <Heading color="white" weight="900" align="center" size="32">
                Farcaster Storage Gift 
              </Heading>
              <Spacer size="22" />
              <Text align="center" color="grey" size="14">
                Gift storage to the users you follow who are low on storage!
              </Text> <Text align="center" color="grey" size="14">
                Powered by Arbitrum.
              </Text>
              <Spacer size="22" />
              <Box flexDirection="row" justifyContent="center">
                  <Text color="white" align="center" size="14">created by</Text>
                  <Spacer size="10" />
                  <Text color="grey" decoration="underline" align="center" size="14"> @0x94t3z</Text>
              </Box>
          </VStack>
      </Box>
    ),
    intents: [
      <Button action='/dashboard'>Start</Button>,
      <Button.AddCastAction action='/fc-storage-gift'>
        Install Action
      </Button.AddCastAction>,
    ]
  })
})


app.castAction(
  '/fc-storage-gift',
  (c) => {
    // Stringify the entire castId object
    const castId = JSON.stringify(c.actionData.castId);

    // Parse the message back to an object to extract fid
    const parsedCastId = JSON.parse(castId);
    const toFid = parsedCastId.fid;

    return c.frame({ path: `/fc-storage-gift-frame/${toFid}`})
  }, 
  { name: "Storage Gift", icon: "database", description: "a cast action to gift farcaster storage.", aboutUrl: "https://warpcast.com/0x94t3z.eth"}
)


app.frame('/fc-storage-gift-frame/:toFid', async (c) => {
  const { toFid } = c.req.param();

  try {

    return c.res({
      action: `/tx-status`,
      image: `/gift-image/${toFid}`,
      intents: [
        <Button.Transaction target={`/tx-gift/${toFid}`}>Confirm</Button.Transaction>,
      ]
    })
    } catch (error) {
      return c.res({
        image: (
          <Box
              grow
              alignVertical="center"
              backgroundColor="black"
              padding="48"
              textAlign="center"
              height="100%"
          >
              <VStack gap="4">
                  <Box flexDirection="row">
                    <Image
                        height="24"
                        objectFit="cover"
                        src="/images/arb.png"
                      />
                    <Spacer size="10" />
                    <Text color="tosca" decoration="underline" align="center" size="14">
                      Arbitrum One
                    </Text>
                  </Box>
                  <Spacer size="16" />
                  <Heading color="white" weight="900" align="center" size="32">
                    ⚠️ Failed ⚠️
                  </Heading>
                  <Spacer size="22" />
                  <Text align="center" color="grey" size="16">
                     Uh oh, something went wrong!
                  </Text>
                  <Spacer size="22" />
                  <Box flexDirection="row" justifyContent="center">
                      <Text color="white" align="center" size="14">created by</Text>
                      <Spacer size="10" />
                      <Text color="grey" decoration="underline" align="center" size="14"> @0x94t3z</Text>
                  </Box>
              </VStack>
          </Box>
        ),
    });
    }
})


app.frame('/dashboard', async (c) => {
  const { fid } = c.var.interactor || {}

  try {

    return c.res({
      image: `/dashboard-image/${fid}`,
      intents: [
        <Button action={`/show/${fid}`}>Yes, please!</Button>,
        <Button.Reset>No</Button.Reset>
      ],
    });
  } catch (error) {
    return c.res({
      image: (
        <Box
            grow
            alignVertical="center"
            backgroundColor="black"
            padding="48"
            textAlign="center"
            height="100%"
        >
            <VStack gap="4">
                <Box flexDirection="row">
                  <Image
                      height="24"
                      objectFit="cover"
                      src="/images/arb.png"
                    />
                  <Spacer size="10" />
                  <Text color="tosca" decoration="underline" align="center" size="14">
                    Arbitrum One
                  </Text>
                </Box>
                <Spacer size="16" />
                <Heading color="white" weight="900" align="center" size="32">
                  ⚠️ Failed ⚠️
                </Heading>
                <Spacer size="22" />
                <Text align="center" color="grey" size="16">
                   Uh oh, something went wrong!
                </Text>
                <Spacer size="22" />
                <Box flexDirection="row" justifyContent="center">
                    <Text color="white" align="center" size="14">created by</Text>
                    <Spacer size="10" />
                    <Text color="grey" decoration="underline" align="center" size="14"> @0x94t3z</Text>
                </Box>
            </VStack>
        </Box>
      ),
      intents: [
        <Button.Reset>Try again</Button.Reset>,
      ]
    });
  }
});


app.image('/dashboard-image/:fid', async (c) => {
  const { fid } = c.req.param();

  const response = await fetch(`${baseUrlNeynarV2}/user/bulk?fids=${fid}`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'api_key': process.env.NEYNAR_API_KEY || '',
    },
  });

  const data = await response.json();
  const userData = data.users[0];

  return c.res({
    imageOptions: {
      headers: {
        'Cache-Control': 'max-age=0',
      },
    },
    image: (
      <Box
        grow
        alignVertical="center"
        backgroundColor="black"
        padding="48"
        textAlign="center"
        height="100%"
      >
        <VStack gap="4">
            <Box flexDirection="row">
              <Image
                  height="24"
                  objectFit="cover"
                  src={logo}
                />
              <Spacer size="10" />
              <Text color="tosca" decoration="underline" align="center" size="14">
                Arbitrum One
              </Text>
            </Box>
            <Spacer size="22" />
            <Box flexDirection="row" alignHorizontal="center" alignVertical="center">
              {/* <Box 
                borderStyle="solid" 
                borderRadius="42"
                borderWidth="4" 
                borderColor="blue" 
                height="64" 
                width="64" 
              >
                <Image
                  borderRadius="38"
                  height="56"
                  width="56"
                  objectFit="cover"
                  src={userData.pfp_url}
                />
              </Box> */}

              <img
                  height="128"
                  width="128"
                  src={userData.pfp_url}
                  style={{
                    borderRadius: "38%",
                    border: "3.5px solid #12A9FF",
                  }}
                />
              
              <Spacer size="12" />
                <Box flexDirection="column" alignHorizontal="left">
                  <Text color="white" align="left" size="14">
                    Hi, {userData.display_name} 👋
                  </Text>
                  <Text color="grey" align="left" size="12">
                    @{userData.username}
                  </Text>
                </Box>
            </Box>
            <Spacer size="22" />
            <Text align="center" color="blue" size="16">
              Do you want to find them?
            </Text>
            <Spacer size="22" />
            <Box flexDirection="row" justifyContent="center">
                <Text color="white" align="center" size="14">created by</Text>
                <Spacer size="10" />
                <Text color="grey" decoration="underline" align="center" size="14"> @0x94t3z</Text>
            </Box>
        </VStack>
    </Box>
    ),
  })
})


app.frame('/show/:fid', async (c) => {
  const { fid } = c.req.param();

  const { buttonValue } = c;

  // Handle navigation logic
  if (buttonValue === 'next' && currentPage < totalPages) {
    currentPage++;
  } else if (buttonValue === 'back' && currentPage > 1) {
    currentPage--;
  }

  try {
    // Fetch relevant following data (because we are using public trial, so we set limit to 100 to avoid rate limit error)
    const followingResponse = await fetch(`${baseUrlNeynarV2}/following?fid=${fid}&limit=100`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'api_key': process.env.NEYNAR_API_KEY || '',
      },
    });
    const followingData = await followingResponse.json();

    // Batch processing
    const chunkedUsers = [];
    if (Array.isArray(followingData.users)) {
        const chunkSize = 15;
        for (let i = 0; i < followingData.users.length; i += chunkSize) {
            chunkedUsers.push(followingData.users.slice(i, i + chunkSize));
        }
    } else {
        console.error('followingData.users is not an array or is undefined');
        // Handle or throw an error as appropriate
    }

    // Array to store promises for storage requests
    const storagePromises = [];

    // Iterate over each chunk and make separate requests for storage data
    for (const chunk of chunkedUsers) {
         const chunkPromises = chunk.map(async (userData: { user: { fid: undefined; display_name: any; username: any; pfp_url: any; }; }) => {
            if (userData && userData.user && userData.user.fid !== undefined &&  userData.user.display_name && userData.user.username && userData.user.pfp_url) {
                const followingFid = userData.user.fid;

                // Check if storage data is already cached
                let storageData = await getFromCache(followingFid);
                if (!storageData) {
                    const storageResponse = await fetch(`${baseUrlNeynarV2}/storage/usage?fid=${followingFid}`, {
                        method: 'GET',
                        headers: {
                            'accept': 'application/json',
                            'api_key': process.env.NEYNAR_API_KEY || '',
                        },
                    });
                    storageData = await storageResponse.json();

                    // Cache the storage data
                    await cacheData(followingFid, storageData);
                }

                if (storageData && storageData.casts && storageData.reactions && storageData.links) {

                    // const totalStorageCapacity = (storageData.casts.capacity + storageData.reactions.capacity + storageData.links.capacity) * storageData.total_active_units;
                    const totalStorageCapacity = storageData.casts.capacity + storageData.reactions.capacity + storageData.links.capacity;

                    const totalStorageUsed = storageData.casts.used + storageData.reactions.used + storageData.links.used;

                    const totalStorageLeft = totalStorageCapacity - totalStorageUsed;

                    return {
                        fid: followingFid,
                        totalStorageLeft: totalStorageLeft,
                    };
                }
            } else {
                console.log("User data is missing necessary properties.");
                return null; // Return null for users with missing properties
            }
        });

        // Add promises for storage requests in this chunk to the main array
        storagePromises.push(...chunkPromises);
    }

    // Wait for all storage requests to complete
    const extractedData = await Promise.all(storagePromises);

    // Filter out null values
    const validExtractedData = extractedData.filter(data => data !== null);

    // Sort the extracted data in ascending order based on total storage left
    validExtractedData.sort((a, b) => a.totalStorageLeft - b.totalStorageLeft);

    // Calculate index range to display data from API
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, validExtractedData.length);
    const displayData = validExtractedData.slice(startIndex, endIndex);

    // Update totalPages based on the current extracted data
    totalPages = Math.ceil(validExtractedData.length / itemsPerPage);
    // Limit totalPages to 5
    totalPages = Math.min(totalPages, 5);

    // Get the follower chosen to gift storage
    const toFid = displayData.length > 0 ? displayData[0].fid : null;

    // Get the total storage left of the follower chosen to gift storage
    const totalStorageLeft = displayData.length > 0 ? displayData[0].totalStorageLeft : null;

    return c.res({
      image: `/show-image/${toFid}/${totalStorageLeft}`,
      intents: [
          <Button action={`/gift/${toFid}`}>Gift</Button>,
          <Button.Reset>Cancel</Button.Reset>,
         currentPage > 1 && <Button value="back">← Back</Button>,
        currentPage < totalPages && <Button value="next">Next →</Button>,
      ],
    });
  } catch (error) {
    return c.res({
      image: (
        <Box
            grow
            alignVertical="center"
            backgroundColor="black"
            padding="48"
            textAlign="center"
            height="100%"
        >
            <VStack gap="4">
                <Box flexDirection="row">
                  <Image
                      height="24"
                      objectFit="cover"
                      src="/images/arb.png"
                    />
                  <Spacer size="10" />
                  <Text color="tosca" decoration="underline" align="center" size="14">
                    Arbitrum One
                  </Text>
                </Box>
                <Spacer size="16" />
                <Heading color="white" weight="900" align="center" size="32">
                  ⚠️ Failed ⚠️
                </Heading>
                <Spacer size="22" />
                <Text align="center" color="grey" size="16">
                   Uh oh, something went wrong!
                </Text>
                <Spacer size="22" />
                <Box flexDirection="row" justifyContent="center">
                    <Text color="white" align="center" size="14">created by</Text>
                    <Spacer size="10" />
                    <Text color="grey" decoration="underline" align="center" size="14"> @0x94t3z</Text>
                </Box>
            </VStack>
        </Box>
      ),
      intents: [
        <Button.Reset>Try again</Button.Reset>,
      ]
    });
  }
});


app.image('/show-image/:toFid/:totalStorageLeft', async (c) => {
  const { toFid, totalStorageLeft } = c.req.param();

  const response = await fetch(`${baseUrlNeynarV2}/user/bulk?fids=${toFid}`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'api_key': process.env.NEYNAR_API_KEY || '',
    },
  });

  const data = await response.json();
  const userData = data.users[0];

  return c.res({
    imageOptions: {
      headers: {
        'Cache-Control': 'max-age=0',
      },
    },
    image: (
        <Box
          grow
          alignVertical="center"
          backgroundColor="black"
          padding="48"
          textAlign="center"
          height="100%"
        >
          <VStack gap="4">
              <Box flexDirection="row">
                <Image
                    height="24"
                    objectFit="cover"
                    src={logo}
                  />
                <Spacer size="10" />
                <Text color="tosca" decoration="underline" align="center" size="14">
                  Arbitrum One
                </Text>
              </Box>
              <Spacer size="22" />
              <Box flexDirection="row" alignHorizontal="center" alignVertical="center">
                
                <img
                    height="96"
                    width="96"
                    src={userData.pfp_url}
                    style={{
                      borderRadius: "38%",
                      border: "3.5px solid #12A9FF",
                    }}
                  />

                <Spacer size="12" />
                  <Box flexDirection="column" alignHorizontal="left">
                    <Text color="white" align="left" size="14">
                      {userData.display_name}
                    </Text>
                    <Text color="grey" align="left" size="12">
                      @{userData.username}
                    </Text>
                  </Box>
                </Box>
              <Spacer size="22" />
              {Number(totalStorageLeft) <= 0 ? (
                <Text align="center" color="red" size="16">
                  💾 Out of storage!
                </Text>
              ) : (
                <Box flexDirection="row" justifyContent="center">
                <Text color="blue" align="center" size="16">💾 {totalStorageLeft}</Text>
                <Spacer size="10" />
                <Text color="white" align="center" size="16">storage left!</Text>
              </Box>
              )}
              <Spacer size="22" />
              <Box flexDirection="row" justifyContent="center">
                  <Text color="white" align="center" size="14">created by</Text>
                  <Spacer size="10" />
                  <Text color="grey" decoration="underline" align="center" size="14"> @0x94t3z</Text>
              </Box>
          </VStack>
      </Box>
    ),
  })
})


app.frame('/gift/:toFid', async (c) => {
  const { toFid } = c.req.param();

  try {

    return c.res({
      action: `/tx-status`,
      image: `/gift-image/${toFid}`,
      intents: [
        <Button.Transaction target={`/tx-gift/${toFid}`}>Confirm</Button.Transaction>,
        <Button action='/'>Cancel</Button>,
      ]
    })
    } catch (error) {
      return c.res({
        image: (
          <Box
              grow
              alignVertical="center"
              backgroundColor="black"
              padding="48"
              textAlign="center"
              height="100%"
          >
              <VStack gap="4">
                  <Box flexDirection="row">
                    <Image
                        height="24"
                        objectFit="cover"
                        src="/images/arb.png"
                      />
                    <Spacer size="10" />
                    <Text color="tosca" decoration="underline" align="center" size="14">
                      Arbitrum One
                    </Text>
                  </Box>
                  <Spacer size="16" />
                  <Heading color="white" weight="900" align="center" size="32">
                    ⚠️ Failed ⚠️
                  </Heading>
                  <Spacer size="22" />
                  <Text align="center" color="grey" size="16">
                     Uh oh, something went wrong!
                  </Text>
                  <Spacer size="22" />
                  <Box flexDirection="row" justifyContent="center">
                      <Text color="white" align="center" size="14">created by</Text>
                      <Spacer size="10" />
                      <Text color="grey" decoration="underline" align="center" size="14"> @0x94t3z</Text>
                  </Box>
              </VStack>
          </Box>
        ),
        intents: [
          <Button.Reset>Try again</Button.Reset>,
        ]
    });
    }
})


app.image('/gift-image/:toFid', async (c) => {
  const { toFid } = c.req.param();

  const response = await fetch(`${baseUrlNeynarV2}/user/bulk?fids=${toFid}`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'api_key': process.env.NEYNAR_API_KEY || '',
    },
  });

  const data = await response.json();
  const userData = data.users[0];

  return c.res({
    imageOptions: {
      headers: {
        'Cache-Control': 'max-age=0',
      },
    },
    image: (
      <Box
        grow
        alignVertical="center"
        backgroundColor="black"
        padding="48"
        textAlign="center"
        height="100%"
      >
        <VStack gap="4">
            <Box flexDirection="row">
              <Image
                  height="24"
                  objectFit="cover"
                  src={logo}
                />
              <Spacer size="10" />
              <Text color="tosca" decoration="underline" align="center" size="14">
                Arbitrum One
              </Text>
            </Box>
            <Spacer size="22" />
            <Box flexDirection="row" alignHorizontal="center" alignVertical="center">

              <img
                  height="128"
                  width="128"
                  src={userData.pfp_url}
                  style={{
                    borderRadius: "38%",
                    border: "3.5px solid #12A9FF",
                  }}
                />
              
              <Spacer size="12" />
                <Box flexDirection="column" alignHorizontal="left">
                  <Text color="white" align="left" size="14">
                    {userData.display_name}
                  </Text>
                  <Text color="grey" align="left" size="12">
                    @{userData.username}
                  </Text>
                </Box>
              </Box>
            <Spacer size="22" />
            <Box flexDirection="row" justifyContent="center">
              <Text color="white" align="center" size="16">Do you want to gift</Text>
              <Spacer size="10" />
              <Text color="blue" align="center" size="16">@{userData.username}</Text>
              <Spacer size="10" />
              <Text color="white" align="center" size="16">?</Text>
            </Box>
            <Spacer size="22" />
            <Box flexDirection="row" justifyContent="center">
                <Text color="white" align="center" size="14">created by</Text>
                <Spacer size="10" />
                <Text color="grey" decoration="underline" align="center" size="14"> @0x94t3z</Text>
            </Box>
        </VStack>
    </Box>
    ),
  })
})

 
app.transaction('/tx-gift/:toFid', async (c, next) => {
  await next();
  const txParams = await c.res.json();
  txParams.attribution = false;
  console.log(txParams);
  c.res = new Response(JSON.stringify(txParams), {
    headers: {
      "Content-Type": "application/json",
    },
  });
},
async (c) => {
  const { address } = c;
  const { toFid } = c.req.param();

  // Get current storage price
  const units = 1n;
  const price = await storageRegistry.read.price([units]);

  const { unsignedTransaction } = await glideClient.createSession({
    payerWalletAddress: address,
   
    // Optional. Setting this restricts the user to only
    // pay with the specified currency.
    paymentCurrency: CurrenciesByChain.ArbitrumOneMainnet.ETH,
    
    transaction: {
      chainId: Chains.Optimism.caip2,
      to: storageRegistry.address,
      value: toHex(price),
      input: encodeFunctionData({
        abi: storageRegistry.abi,
        functionName: "rent",
        args: [BigInt(toFid), units],
      }),
    },
  });

  if (!unsignedTransaction) {
    throw new Error("missing unsigned transaction");
  }

  return c.send({
    chainId: Chains.Arbitrum.caip2,
    to: unsignedTransaction.to,
    data: unsignedTransaction.input || undefined,
    value: hexToBigInt(unsignedTransaction.value),
  });
})


app.frame("/tx-status", async (c) => {
  const { transactionId, buttonValue } = c;
 
  // The payment transaction hash is passed with transactionId if the user just completed the payment. If the user hit the "Refresh" button, the transaction hash is passed with buttonValue.
  const txHash = transactionId || buttonValue;
 
  if (!txHash) {
    throw new Error("missing transaction hash");
  }
 
  try {
    let session = await glideClient.getSessionByPaymentTransaction({
      chainId: Chains.Arbitrum.caip2,
      txHash,
    });
 
    // Wait for the session to complete. It can take a few seconds
    session = await glideClient.waitForSession(session.sessionId);
 
    return c.res({
      image: (
        <Box
          grow
          alignVertical="center"
          backgroundColor="black"
          padding="48"
          textAlign="center"
          height="100%"
        >
          <VStack gap="4">
              <Box flexDirection="row">
                <Image
                    height="24"
                    objectFit="cover"
                    src="/images/arb.png"
                  />
                <Spacer size="10" />
                <Text color="tosca" decoration="underline" align="center" size="14">
                  Arbitrum One
                </Text>
              </Box>
              <Spacer size="16" />
              <Heading color="white" weight="900" align="center" size="32">
                Status
              </Heading>
              <Spacer size="22" />
              <Text align="center" color="blue" size="16">
                Storage gifted successfully!
              </Text>
              <Spacer size="22" />
              <Box flexDirection="row" justifyContent="center">
                  <Text color="white" align="center" size="14">created by</Text>
                  <Spacer size="10" />
                  <Text color="grey" decoration="underline" align="center" size="14"> @0x94t3z</Text>
              </Box>
          </VStack>
      </Box>
      ),
      intents: [
        <Button.Link
          href={`https://optimistic.etherscan.io/tx/${session.sponsoredTransactionHash}`}
        >
          View on Exploler
        </Button.Link>,
        <Button.Reset>Home</Button.Reset>,
      ],
    });
  } catch (e) {
    // If the session is not found, it means the payment is still pending.
    // Let the user know that the payment is pending and show a button to refresh the status.
    return c.res({
      image: '/waiting.gif',
      intents: [
        <Button value={txHash} action="/tx-status">
          Refresh
        </Button>,
      ],
    });
  }
});


// Uncomment for local server testing
devtools(app, { serveStatic });

export const GET = handle(app)
export const POST = handle(app)
