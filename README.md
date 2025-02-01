# Orca VS Code Extension README

## Overview

The **Orca VS Code Extension** (also referred to as the **Orca IDE**) provides an integrated development environment for creating and managing configuration files for **Orca**, a lab automation scheduler. This extension allows users to edit, validate, and execute **.orca.yml** configuration files directly within **VS Code**.

Orca enables users to define and run workflows for lab automation by coordinating robotic instruments. The VS Code extension simplifies the process by providing tools for editing configurations, managing drivers, and executing workflows/methods within the IDE.

🚀 **Note:** This is a **prototype**. Bugs are expected. 

💬 Feedback is highly encouraged! I want **all feedback**, even if you hate the entire premise of this. Would you use this? Would you never use it? Would you prefer this to be standard Python classes instead of a configuration file? How do we fix lab automation?!  Let me know what works, what doesn't, and what should change. If you have suggestions, reach out at [**support@cheshirelabs.io**](mailto:support@cheshirelabs.io).

## Features

- **YAML Schema Support:** Provides a schema for `*.orca.yml` files to assist in writing valid configurations.
- **Example Workflows:** Includes example workflows for testing.
  - **SMC Assay**: Can be simulated within the IDE.
  - **Venus Demo**: Uses the **Venus Driver** to open **Hamilton Venus**.
- **Driver Management:** Install and uninstall **Orca drivers** from the extension.
- **Workflow & Method Execution:**
  - Load an **.orca.yml** configuration file.
  - Select workflows and methods to execute within the VS Code UI.
  - Define where labware starts and ends (labware must start on a **plate pad**).
- **Logging System:**
  - **Orca Extension Log**: Logs related to the extension’s operations.
  - **Orca Server Log**: Logs for the Orca server, API calls, etc.
  - **Orca Logs**: Logs showing simulation details.
- **Activity Bar Integration:** Opens with the **Cheshire Labs** logo, providing access to different views:
  - **Workflows View:** Shows workflows in the loaded configuration.
  - **Methods View:** Displays available methods.
  - **Installed Drivers:** Shows installed drivers.
  - **Available Drivers:** Lists drivers that can be installed.

## Installation

1. Install the extension from the **VS Code Marketplace**.
2. Install Orca via pip:
   ```sh
   pip install cheshire-orca
   ```
3. If using the **Venus example**, install the driver:
   ```sh
   pip install orca-driver-venus
   ```
   Alternatively, use the **IDE’s driver install functionality**.

4. If using the **Venus Driver**, see [https://github.com/Cheshire-Labs/venus-driver](https://github.com/Cheshire-Labs/venus-driver) for the Venus driver and Venus submethod. 


## Running the Examples

Before running the examples, ensure that the **Orca VS Code Extension** is installed via the **VS Code Marketplace**.

### SMC Assay Example

The **SMC Assay** example can be found in the `examples/smc_assay` folder. This example can be simulated directly within the **Orca IDE**.

#### Steps to Run:

1. **Open the Configuration File (Optional)**

   - Open `examples/smc_assay/smc_assay_example.orca.yml` in **VS Code** to review the setup.

2. **Load the Configuration File**

   - Click the **Load button** (☁️ with an up arrow) at the top right of the **Workflows View**.
   - Select the file `examples/smc_assay/smc_assay_example.orca.yml`.

3. **Run the Workflow**

   - Click the **Play button** next to a workflow.
   - Select a **configuration deployment stage** when prompted. (This corresponds to a defined stage in the `config` section of the configuration file.)
   - The workflow should begin execution, and logs will be output in the **Logging Window**.

4. **Run a Method (Optional)**

   - Click the **Play button** next to a method.
   - Select the deployment stage.
   - When prompted, select the **start and end locations** for each required labware.

### Venus Demo Example

The **Venus Demo** example is located in the `examples/venus_demo` folder. To run this example successfully, follow these steps:

1. **Import the Venus Packages**

   - The `.pkg` files included in the `venus_demo` folder must be imported into **Hamilton Venus**.
   - Place the methods in the following directory:
     ```
     C:\Program Files (x86)\HAMILTON\Methods\Cheshire Labs\
     ```

2. **Install the Venus Driver**

   - The Venus example requires the **Orca Venus Driver** to be installed.
   - You can install it using **pip**:
     ```sh
     pip install orca-driver-venus
     ```
   - Alternatively, install it directly via the **Orca IDE** under the **Available Drivers** section.

3. **Load the Configuration File**

   - Open the **Orca IDE** in VS Code.
   - Click the **Load button** (☁️ with an up arrow) at the top right of the **Workflows View**.
   - Select the file `examples/venus_demo/venus_demo.orca.yml`.

4. **Run the Venus Demo**

   - Click the **Play button** next to the **Venus Demo** workflow or method.
   - Select the **configuration deployment stage** when prompted.
   - If running a method, you will need to select the **start and end locations** for required labware.

By following these steps, you can execute the **SMC Assay** and **Venus Demo** examples within the **Orca IDE**. Let me know if you need further clarification!



## Using the Extension

### 1. Loading a Configuration File

- Click the **"Load Configuration"** button in the Workflows view.
- Select a `*.orca.yml` file.

### 2. Running a Workflow

- Click the **Play button** next to a workflow.
- Select a **configuration deployment stage** (a dropdown will appear).
- The workflow will run using **Orca**.

### 3. Running a Method

- Click the **Play button** next to a method.
- Select a **configuration deployment stage**.
- Assign start and end locations for **each method’s expected labware**.

### 4. Installing and Uninstalling Drivers

- **To Install a Driver:** Click the **Download button** in the "Available Drivers" view.
- **To Uninstall a Driver:** Click the **Trash icon** in the "Installed Drivers" view.

### 5. Logging

- View logs from the **Logging Window**.
- Select log type from the dropdown menu.

## Known Limitations

- **Labware cannot start or end on instruments**; they must **start on a plate pad**.
- **The 'Stop' command does not work**; use **'Stop Server'** instead.

## Commands Available

| Command                    | Description                                    |
| -------------------------- | ---------------------------------------------- |
| `orca.copyExamples`        | Copy example Orca YAML files to the workspace. |
| `orca-ide.loadYaml`        | Load an Orca configuration file.               |
| `orca-ide.initialize`      | Initialize resources.                          |
| `orca-ide.runWorkflow`     | Run a workflow.                                |
| `orca-ide.runMethod`       | Run a method.                                  |
| `orca-ide.startServer`     | Start the Orca server.                         |
| `orca-ide.stopServer`      | Stop the Orca server.                          |
| `orca-ide.stop`            | **(Not working)** Use "Stop Server" instead.   |
| `orca-ide.installDriver`   | Install a driver.                              |
| `orca-ide.uninstallDriver` | Uninstall a driver.                            |


## Additional Resources

- **Orca Repo & Configuration Guide:** [https://github.com/Cheshire-Labs/orca](https://github.com/Cheshire-Labs/orca)
- **Venus Driver Repo:** [https://github.com/Cheshire-Labs/venus-driver](https://github.com/Cheshire-Labs/venus-driver)

## License

This project is licensed under the **GNU Affero General Public License**.

---

📢 **Feedback is encouraged!** Let’s work together to improve lab automation! Reach out at [**support@cheshirelabs.io**](mailto\:support@cheshirelabs.io).

