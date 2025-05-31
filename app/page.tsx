'use client';
import React, { useState, useEffect } from 'react';

export default function Home() {
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [isPayment, setIsPayment] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('');
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvv: '',
  });
  const [vaData, setVaData] = useState({
    gross_amount: '',
    bank: '',
  });
  const [qrisData, setQrisData] = useState({
    gross_amount: '',
  });

  const [listPayment] = useState([
    {
      paymentName: 'Credit Card',
      paymentType: 'credit_card',
      paymentCode: 'credit_card',
    },
    {
      paymentName: 'Virtual Account',
      paymentType: 'bank_transfer',
      paymentCode: 'va',
    },
    {
      paymentName: 'QRIS',
      paymentType: 'qris',
      paymentCode: 'gopay',
    },
  ]);
  const [transactionData, setTransactionData] = useState<any>({});

  const handlePayment = () => {
    try {
      setIsPayment(true);
      let payload;

      if (selectedPayment === 'credit_card') {
        payload = {
          payment_type: 'credit_card',
          credit_card: {
            number: cardData.number,
            expiry: cardData.expiry,
            cvv: cardData.cvv,
          },
        };
      } else if (selectedPayment === 'bank_transfer') {
        payload = {
          payment_type: 'bank_transfer',
          gross_amount: vaData.gross_amount.replaceAll('.', '').toString(),
          bank: vaData.bank,
        };
      } else if (selectedPayment === 'qris') {
        payload = {
          payment_type: 'qris',
          gross_amount: qrisData.gross_amount.replaceAll('.', '').toString(),
          bank: 'gopay',
        }
      } else {
        throw new Error('Invalid payment method selected');
      }

      fetch('https://api.farrid.dev/v1/s/kun-payments/payment/charge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
        .then((response) => response.json())
        .then((data) => {
          if (!data || !data.data || !data.data.transaction_id) {
            throw new Error('Invalid response from server');
          }

          window.location.href = `/?t_id=${data.data.transaction_id}`;
          console.log('Payment successful:', data);
        })
        .catch((error) => {
          console.error('Payment error:', error);
        })
        .finally(() => {
          setIsPayment(false);
          setSelectedPayment('');
          setCardData({ number: '', expiry: '', cvv: '' });
          setVaData({ gross_amount: '', bank: '' });
        });
    } catch (error) {
      console.error('Error during payment:', error);
      alert('An error occurred. Please try again.');
      setIsPayment(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCardData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const t_id = params.get('t_id');
      setTransactionId(t_id);

      if (t_id) {
        fetch(`https://api.farrid.dev/v1/s/kun-payments/payment/transactionData?transaction_id=${t_id}`)
          .then((response) => response.json())
          .then((data) => {
            if (data && data.data) {
              setTransactionData(data.data);
            } else {
              console.error('Invalid transaction data:', data);
            }
          })
          .catch((error) => {
            console.error('Error fetching transaction data:', error);
          });
      }
    }
  }, []);

  useEffect(() => {
    if (!transactionId) return;
    const ws = new WebSocket('wss://kun-sgd-1-u.run.place/ws');
    ws.onopen = () => {
      ws.send(JSON.stringify({ join: transactionId }));
      console.log('WebSocket connection established for transaction:', transactionId);
    };
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.event === 'transaction_status') {
          if (data.status === 'Payment Accept') {
            console.log('Payment accepted:', data.status);
            alert('Payment was successful!');
          }
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    };
    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };
    return () => {
      ws.close();
    };
  }, [transactionId]);

  const renderPaymentCredit = () => (
    <>
      <input
        type="text"
        placeholder="Card Number"
        className="border border-gray-300 rounded-md p-2 mb-4 w-full max-w-xs text-black"
        name="number"
        value={cardData.number}
        onChange={handleInputChange}
      />
      <input
        type="text"
        placeholder="Card Expiry (MM/YY)"
        className="border border-gray-300 rounded-md p-2 mb-4 w-full max-w-xs text-black"
        name="expiry"
        value={cardData.expiry}
        onChange={handleInputChange}
      />
      <input
        type="text"
        placeholder="Card CVV"
        className="border border-gray-300 rounded-md p-2 mb-4 w-full max-w-xs text-black"
        name="cvv"
        value={cardData.cvv}
        onChange={handleInputChange}
      />
    </>
  )

  const renderPaymentVa = () => (
    <>
      <select
        className="border border-gray-300 rounded-md p-2 mb-4 w-full max-w-xs text-black"
        value={vaData.bank}
        onChange={(e) => setVaData({
          ...vaData,
          bank: e.target.value,
        })}
      >
        <option value="" disabled>Select Bank</option>
        <option value="bri">BRI</option>
        <option value="bca">BCA</option>
        <option value="permata">Permata Bank</option>
      </select>
      <input
        type="text"
        className="border border-gray-300 rounded-md p-2 mb-4 w-full max-w-xs text-black"
        value={`Rp ${vaData.gross_amount}`}
        onChange={(e) => setVaData({
          ...vaData,
          gross_amount: e.target.value,
        })}
        placeholder="Gross Amount"
        pattern="[0-9]*"
        inputMode="numeric"
        onInput={(e) => {
          const input = e.target as HTMLInputElement;
          input.value = input.value.replace(/[^0-9]/g, '');
          input.value = new Intl.NumberFormat('id-ID', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(Number(input.value.replace(/[^0-9]/g, '')));
          if (input.value === 'NaN') {
            input.value = '';
          }
        }}
      />
    </>
  );

  const renderPaymentQris = () => (
    <>
      <input
        type="text"
        className="border border-gray-300 rounded-md p-2 mb-4 w-full max-w-xs text-black"
        value={`Rp ${qrisData.gross_amount}`}
        onChange={(e) => setQrisData({
          ...qrisData,
          gross_amount: e.target.value,
        })}
        placeholder="Gross Amount"
        pattern="[0-9]*"
        inputMode="numeric"
        onInput={(e) => {
          const input = e.target as HTMLInputElement;
          input.value = input.value.replace(/[^0-9]/g, '');
          input.value = new Intl.NumberFormat('id-ID', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(Number(input.value.replace(/[^0-9]/g, '')));
          if (input.value === 'NaN') {
            input.value = '';
          }
        }}
      />
    </>
  );

  return (
    <div className="flex justify-center font-[family-name:var(--font-geist-sans)]">
      <main className="p-16 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center">Kun - Payments</h1>
        <p className="text-lg text-gray-600 pb-4 text-center">
          Payments Integration with Midtrans
        </p>
        <div
          className="flex flex-col items-center gap-4 px-8 py-6 border border-gray-300 rounded-md shadow-md bg-white"
        >
          {!transactionData?.order_id ? (
            <>
              <select
                className="border border-gray-300 rounded-md p-2 mb-4 w-full max-w-xs text-black"
                value={selectedPayment}
                onChange={(e) => setSelectedPayment(e.target.value)}
              >
                <option value="" disabled>Select Payment Method</option>
                {listPayment.map((payment) => (
                  <option key={payment.paymentCode} value={payment.paymentType}>
                    {payment.paymentName}
                  </option>
                ))}
              </select>
              {selectedPayment === 'credit_card' && renderPaymentCredit()}
              {selectedPayment === 'bank_transfer' && renderPaymentVa()}
              {selectedPayment === 'qris' && renderPaymentQris()}

              <button
                className="bg-blue-500 text-white rounded-md p-2 w-full max-w-xs cursor-pointer"
                onClick={handlePayment}
                disabled={isPayment || !selectedPayment}
                style={{ opacity: isPayment || !selectedPayment ? 0.5 : 1 }}
              >
                Pay Now
              </button>
            </>
          ) : (
            <div className="w-full">
              <h2 className="text-xl font-semibold mb-4 text-black">Transaction Details</h2>
              {transactionData?.actions && transactionData.actions.length > 0 && transactionData.actions[0].name === 'generate-qr-code' ? (
                <img
                  src={transactionData.actions[0].url}
                  alt="QR Code"
                  className="w-full h-auto mb-4"
                  crossOrigin='anonymous'
                />
              ) : null}

              <p className="text-black"><strong>Orders ID:</strong> {transactionData.order_id}</p>
              <p className="text-black"><strong>Status:</strong> {transactionData.transaction_status}</p>
              <p className="text-black"><strong>Payment Method:</strong> {transactionData?.bank ?? 'Credit Card'}</p>
              {transactionData?.va_number ? (
                <p className="text-black"><strong>Virtual Account Number:</strong> {transactionData.va_number}</p>
              ) : <></>}
              <p className="text-black"><strong>Gross Amount:</strong> Rp {transactionData.gross_amount}</p>
              <p className="text-black"><strong>Expired at:</strong> {transactionData.expiry_time}</p>

              <button
                className="bg-blue-500 text-white rounded-md p-2 w-full max-w-xs cursor-pointer mt-4"
                onClick={() => {
                  setTransactionId(null);
                  setTransactionData([]);
                  window.location.href = '/';
                }}
              >
                Create New Transaction
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
