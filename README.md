# ⚡ Watt's Up — Energy Lab & Smart Home Simulator

**Watt's Up** is an interactive, real-time smart home energy consumption tracker and live load monitoring application. Built for educational and simulation purposes, it allows users to monitor household power draw, estimate daily and monthly utility costs, customize tariff rates, and physically control household appliances using a **BBC micro:bit** microcontroller over **USB Cable** or **Wireless Bluetooth**.

---

## ✨ Features Offered

- ⚡ **Live Load Meter**: High-precision circular gauge displaying instantaneous power draw (W) with efficiency and maximum capacity readouts.
- 📟 **Digital LCD Readouts**: Real-time calculated indicators for:
  - **Today's Energy**: Total kilowatt-hours (kWh) consumed today.
  - **Today's Cost**: Calculated cost based on custom tariff rates (RM/kWh).
  - **Projected Monthly Cost**: Estimated monthly utility bill projection based on active usage.
  - **Active Appliances**: Count and list of currently running devices.
- 🏠 **Household Appliance Manager**:
  - Toggle appliances ON/OFF in real time.
  - Adjust individual device wattage dynamically.
  - Add new household appliances (Air Conditioner, Refrigerator, EV Charger, Induction Cooktop, Washing Machine, Desktop PC, Water Heater, Smart TV).
  - One-click "Turn On All" / "Turn Off All" controls.
- 📊 **Usage Breakdown & Analytics**: Detailed breakdown views of historical energy consumption per appliance with visual charts.
- 🕹️ **BBC micro:bit Hardware Control**: Dual-mode physical hardware integration via **Web Serial (USB Cable)** and **Web Bluetooth (BLE)**.
- 🎨 **Dynamic Dark & Light Modes**: Sleek ambient glowing cyber-dark theme with seamless light mode toggle.
- 💾 **Local Data Persistence**: Auto-saves appliances state, history, tariff rate, and preferences to `localStorage`.

---

## 🕹️ BBC micro:bit Hardware Control

You can connect a physical **BBC micro:bit** to control household appliances directly using hardware buttons!

### Appliances Controlled by micro:bit
| Hardware Control | Target Appliance | Action |
| :--- | :--- | :--- |
| 🔘 **Button A** | ❄️ **Air Conditioner** (`ac`) | Toggles Power (ON / OFF) |
| 🔘 **Button B** | 🧺 **Washing Machine** (`washing_machine`) | Toggles Power (ON / OFF) |

---

### MakeCode Setup Guide

To program your micro:bit for both **USB Cable** and **Wireless Bluetooth** support:

1. Open [MakeCode for micro:bit](https://makecode.microbit.org).
2. Add the **Bluetooth** extension (under *Extensions*).
3. Switch to the **JavaScript** tab and paste the following code:

```typescript
// Start the Bluetooth Button Service immediately on boot
bluetooth.startButtonService()

// Button A: Toggles Air Conditioner
input.onButtonPressed(Button.A, function () {
    serial.writeLine("BUTTON_A")
})

// Button B: Toggles Washing Machine
input.onButtonPressed(Button.B, function () {
    serial.writeLine("BUTTON_B")
})
```

4. **Crucial Bluetooth Setting**:
   - Click the **Gear Icon ⚙️** (top right) ➔ **Project Settings**.
   - Toggle **No Passkey Needed: Anyone can connect via Bluetooth** to **ON** (`true`).
   - Click **Save**.
5. Download and flash the `.hex` file to your micro:bit.

---

### How to Connect to micro:bit in the App

Ensure you are using a Chromium-based browser (**Google Chrome**, **Microsoft Edge**, or **Opera**).

#### 🔌 Method 1: USB Cable (Web Serial API — Recommended)
1. Plug your micro:bit into your computer using a USB data cable.
2. In the app header at `http://localhost:3000`, click **USB Cable** mode.
3. Click **Connect (USB)**.
4. Select **BBC micro:bit** / **mbed Serial Port** in the browser pop-up prompt and click **Connect**.

#### 📶 Method 2: Wireless Bluetooth (Web Bluetooth API)
1. Turn on Bluetooth on your computer.
2. Put micro:bit into **Pairing Mode**: Hold **Button A + B** ➔ Press & release **Reset** on the back.
3. *(Recommended on Windows)* Pair `BBC micro:bit` first in **Windows Bluetooth Settings**.
4. In the app header at `http://localhost:3000`, click **Bluetooth** mode.
5. Click **Connect (BLE)** and select your micro:bit in the browser chooser.

---

## 🚀 Setup & Local Development

### Prerequisites
- **Node.js**: v20.0.0 or higher
- **npm**: v10.0.0 or higher
- **Browser**: Google Chrome or Microsoft Edge (for Web Serial / Web Bluetooth support)

### Installation & Execution

1. Clone the repository and navigate to the project directory:
   ```bash
   cd WattsNew
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```text
   http://localhost:3000
   ```

---

## 🌐 Deploying to GitHub Pages (`github.io`)

This project is fully compatible with **GitHub Pages**! In fact, GitHub Pages provides an **HTTPS (`https://`) origin**, which is required by browsers for Web Serial and Web Bluetooth APIs to work smoothly online.

### Automatic Deployment (via GitHub Actions)

An automated deployment workflow is configured in [.github/workflows/deploy.yml](file:///.github/workflows/deploy.yml).

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "Configure GitHub Pages deployment"
   git push origin main
   ```
2. On GitHub, go to your repository **Settings** ➔ **Pages**.
3. Under **Build and deployment** ➔ **Source**, select **GitHub Actions**.
4. GitHub Actions will automatically build and publish your site at:
   `https://<your-username>.github.io/<repository-name>/`

---

## 🛠️ Built With

- **React 19** & **TypeScript**
- **Vite** (Development server & bundling)
- **Tailwind CSS** & **Lucide React** (Styling & icons)
- **Web Serial API** & **Web Bluetooth API** (Hardware connectivity)
