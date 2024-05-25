# Usage: #



    async function dummyProcess(d:any): Promise<any> {
      return new Promise(resolve => { 
        setTimeout(() => {
          resolve(`Task completed ${d} `);  
        }, 1000);
      });
    }
    async function dummyProcess2(d:any): Promise<any> {
      return new Promise(resolve => { 
        setTimeout(() => {
          resolve(`Task completed dummy2 ${d} `);  
        }, 1000);
      });
    }
    console.log(QueueProcessor);
    const queueProcessor = new QueueProcessor();
    queueProcessor.addProcessor(dummyProcess,2);
    queueProcessor.addProcessor(dummyProcess2,1);

    const buffer=queueProcessor.addDataToBuffer(i);
    buffer.then((res) => {
      console.log('result:', JSON.stringify(res));
    });
