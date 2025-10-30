import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, Bitcoin } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Subscription {
  id: string;
  plan_type: string;
  expires_at: string;
  status: string;
  crypto_currency: string;
  amount: number;
}

export default function PremiumTab() {
  const [userRole, setUserRole] = useState<string>("");
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [cryptoCurrency, setCryptoCurrency] = useState<string>("BTC");
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [transactionHash, setTransactionHash] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUserRole();
    fetchSubscription();
  }, []);

  const fetchUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setUserRole(data.role);
    }
  };

  const fetchSubscription = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setSubscription(data);
    }
  };

  const plans = [
    {
      id: "monthly",
      name: "Premium Monthly",
      price: "0.001 BTC",
      description: "Full access for 30 days",
      features: [
        "Unlimited chart analyses",
        "Advanced technical indicators",
        "Pattern recognition AI",
        "Priority support",
        "Export analysis reports",
        "Real-time alerts"
      ]
    },
    {
      id: "yearly",
      name: "Premium Yearly",
      price: "0.01 BTC",
      description: "Full access for 365 days + 2 months free",
      features: [
        "All Monthly features",
        "2 months free (14 months total)",
        "Advanced portfolio tracking",
        "Custom indicator creation",
        "API access",
        "Priority feature requests"
      ],
      popular: true
    }
  ];

  const cryptoPrices: Record<string, number> = {
    "BTC": 0.001,
    "ETH": 0.02,
    "USDT": 50,
    "USDC": 50
  };

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    setShowPaymentDialog(true);
  };

  const handleSubmitPayment = async () => {
    if (!walletAddress || !transactionHash) {
      toast.error("Please provide wallet address and transaction hash");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (selectedPlan === "yearly" ? 365 + 60 : 30));

      const amount = selectedPlan === "yearly" 
        ? cryptoPrices[cryptoCurrency] * 10 
        : cryptoPrices[cryptoCurrency];

      const { error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          plan_type: selectedPlan,
          crypto_currency: cryptoCurrency,
          amount: amount,
          wallet_address: walletAddress,
          transaction_hash: transactionHash,
          status: 'pending',
          expires_at: expiresAt.toISOString()
        });

      if (error) throw error;

      toast.success("Payment submitted! We'll verify your transaction and activate your subscription shortly.");
      setShowPaymentDialog(false);
      setWalletAddress("");
      setTransactionHash("");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const paymentAddresses: Record<string, string> = {
    "BTC": "bc1qhenu8ts7rxv2yj4ac3udtwx6fy9znh2a9hv8aw",
    "ETH": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "USDT": "TJRyWwFs9wTFGZg3JbrVriFbNfCug5tDeC",
    "USDC": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
  };

  if (userRole === "premium" && subscription) {
    const expiresAt = new Date(subscription.expires_at);
    const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    return (
      <div className="space-y-6">
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Crown className="h-6 w-6 text-primary" />
              <CardTitle>Premium Active</CardTitle>
            </div>
            <CardDescription>
              Your premium subscription is active
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan:</span>
                <span className="font-semibold capitalize">{subscription.plan_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Days Remaining:</span>
                <span className="font-semibold">{daysLeft} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expires:</span>
                <span className="font-semibold">{expiresAt.toLocaleDateString()}</span>
              </div>
            </div>
            <div className="pt-4 border-t">
              <h4 className="font-semibold mb-2">Active Features:</h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm">Unlimited analyses</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm">Advanced indicators</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm">Pattern recognition</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Upgrade to Premium</h2>
        <p className="text-muted-foreground">
          Unlock advanced trading analysis features with crypto payment
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className={plan.popular ? "border-primary shadow-lg" : ""}>
            <CardHeader>
              {plan.popular && (
                <Badge className="w-fit mb-2">
                  <Zap className="h-3 w-3 mr-1" />
                  Most Popular
                </Badge>
              )}
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="pt-4">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground text-sm"> / {plan.id === "yearly" ? "year" : "month"}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button 
                className="w-full" 
                variant={plan.popular ? "default" : "outline"}
                onClick={() => handleSelectPlan(plan.id)}
              >
                <Bitcoin className="h-4 w-4 mr-2" />
                Pay with Crypto
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
            <DialogDescription>
              Send the exact amount to our wallet and provide transaction details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="crypto">Cryptocurrency</Label>
              <Select value={cryptoCurrency} onValueChange={setCryptoCurrency}>
                <SelectTrigger id="crypto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                  <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                  <SelectItem value="USDT">Tether (USDT)</SelectItem>
                  <SelectItem value="USDC">USD Coin (USDC)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-semibold">
                  {selectedPlan === "yearly" 
                    ? (cryptoPrices[cryptoCurrency] * 10).toFixed(4)
                    : cryptoPrices[cryptoCurrency].toFixed(4)
                  } {cryptoCurrency}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Send to:</span>
                <code className="text-xs bg-background p-2 rounded break-all">
                  {paymentAddresses[cryptoCurrency]}
                </code>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wallet">Your Wallet Address</Label>
              <Input
                id="wallet"
                placeholder="Enter your wallet address"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tx-hash">Transaction Hash</Label>
              <Input
                id="tx-hash"
                placeholder="Enter transaction hash"
                value={transactionHash}
                onChange={(e) => setTransactionHash(e.target.value)}
              />
            </div>

            <Button 
              className="w-full" 
              onClick={handleSubmitPayment}
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Payment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
