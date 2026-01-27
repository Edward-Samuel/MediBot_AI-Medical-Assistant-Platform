import { Pinecone } from "@pinecone-database/pinecone";

const pc = new Pinecone({
  apiKey: "pcsk_5Stj1f_Bf3iKowi3E56yuekB8Uk3pU5Xu1rHYrovcNmtveR9wedyNYtprpEAeecVVbxMt9"
});

const index = pc.index("medibot-faq");
await index.deleteAll();

console.log("Deleted all vectors");
