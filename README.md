# Usage: #


      async function dummyProcess(d:any): Promise<any> {
        return new Promise(resolve => { 
        setTimeout(() => {
          resolve(`Task completed ${d} `);  
        }, 1000);
        });
      }

      const queueProcessor = new QueueProcessor(4, dummyProcess);

      const waiting=queueProcessor.addDataToBuffer(1);
      console.log("adding data to buffer");
      waiting.then((res) => {console.log(res);}); 