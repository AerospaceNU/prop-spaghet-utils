# Jack Hester for AeroNU
import asyncio
import websockets
import json
import csv
import os
import time
from tkinter import Tk, Label, Button, Entry, filedialog, StringVar
import threading


EXAMPLE_DATA_JSON = """{
    "command": "DATA",
    "calibrated?": "true",
    "data": {
        "loadCellSensors": {
            "EX_SENSOR_1": {
                "sensorReading": -5.476813068846521,
                "unit": "LBS"
            }
        },
        "pressureSensors": {
            "EX_SENSOR_2": {
                "sensorReading": 2.2792993667654207,
                "unit": "PSI"
            },
            "EX_SENSOR_3": {
                "sensorReading": 7.950959608789882,
                "unit": "KG_PER_SEC"
            }
        },
        "tempSensors": {
            "EX_SENSOR_4": {
                "sensorReading": 26.16680223534908,
                "unit": "CELSIUS"
            }
        },
        "valves": {
            "EX_SENSOR_1": {
                "valveState": "OPEN"
            },
            "EX_SENSOR_2": {
                "valveState": "CLOSED"
            },
            "EX_SENSOR_3": {
                "valveState": "INVALID"
            }
        }
    },

    "timeStamp": 1658422515934
}
"""
ERRORLESS_INFO = "Errors will appear here"

class LoggerApp:
    def __init__(self, master):
        self.master = master
        master.title("AeroNU Propulsion Logger")

        self.address_label = Label(master, text="Address")
        self.address_var = StringVar(value='ecs-sim-pi.local:9002')
        self.address_entry = Entry(master, textvariable=self.address_var)

        self.specified_json = StringVar(value=EXAMPLE_DATA_JSON)
        self.specified_json_label = Label(master, textvariable=self.specified_json, justify="left")
        self.info_bar = Label(master, text=ERRORLESS_INFO, fg="black")

        self.blankspace = Label(master, text="")
        self.blankspace_2 = Label(master, text="")
        self.blankspace_3 = Label(master, text="")
        self.blankspace_4 = Label(master, text="")

        # make layout a little nicer
        self.blankspace.grid(row=0,column=0,columnspan=3)
        self.blankspace_2.grid(row=2,column=0,columnspan=3)
        self.blankspace_3.grid(row=6,column=0,columnspan=3)
        self.blankspace_4.grid(row=4, column=0, columnspan=3)
        self.address_label.grid(row=1, column=0, sticky="N")
        self.address_entry.grid(row=1, column=1, columnspan=2, sticky="N")
        self.specified_json_label.grid(row=1, column=3, columnspan=2)
        self.info_bar.grid(row=2, column=0)


        self.last_gui_update_time = 0
        self.cur_data_json = json.loads(EXAMPLE_DATA_JSON)
        self.main_loop()


    def main_loop(self):
        user_str = self.address_var.get()

        json_to_be_displayed = self.cur_data_json # set to default og json if user input doesn't work
        try:
            json_to_be_displayed = eval(f"self.cur_data_json{user_str}")
            self.info_bar.config(fg="black", text=ERRORLESS_INFO)
        except SyntaxError as e:
            self.info_bar.config(fg="red", text=repr(e))
        except KeyError as e:
            self.info_bar.config(fg="red", text=repr(e))
        except Exception as e:
            self.info_bar.config(fg="red", text=repr(e))

        self.specified_json.set(json.dumps(json_to_be_displayed, indent=4))
        self.master.after(1000, self.main_loop)


    # def enable_close_button(self):
    #     self.master.destroy()

    # def start_logging(self):
    #     if not self.save_directory:
    #         self.choose_directory()

    #     self.master.protocol("WM_DELETE_WINDOW", self.disable_close_button)

    #     if self.save_directory:
    #         self.is_logging = True
    #         self.start_button.config(state='disabled')
    #         self.stop_button.config(state='normal')
    #         self.new_file_button.config(state='normal')
    #         self.address = self.address_var.get()
    #         self.csv_file, self.csv_writer = self.create_csv_file()
    #         self.worker_thread = threading.Thread(target=self.start_websocket, daemon=True)
    #         self.worker_thread.start()

    # def stop_logging(self):
    #     self.is_logging = False
        
    #     self.master.protocol("WM_DELETE_WINDOW", self.enable_close_button)

    #     self.start_button.config(state='normal')
    #     self.stop_button.config(state='disabled')
    #     self.new_file_button.config(state='disabled')
    #     if self.csv_file:
    #         self.csv_file.close()

    # def new_file(self):
    #     if self.csv_file:
    #         self.csv_file.close()
    #         self.csv_file, self.csv_writer = self.create_csv_file()
    #         self.header_written = False

    # def choose_directory(self):
    #     self.save_directory = filedialog.askdirectory()

    # def create_csv_file(self):
    #     file_name = os.path.join(self.save_directory, f"logger_{time.strftime('%m-%d-%Y_%H-%M-%S', time.localtime( int(time.time()) ))}.csv")
    #     csv_file = open(file_name, 'w', newline='')
    #     csv_writer = csv.writer(csv_file)
    #     return csv_file, csv_writer

    def start_websocket(self):
        asyncio.run(self.connect())

    async def connect(self):
        uri = f"ws://{self.address}"
        print("Connecting to: ", uri)
        async with websockets.connect(uri) as websocket:
            while self.is_logging:
                data = await websocket.recv()
                json_data = json.loads(data)
                self.process_data(json_data)

    # This is where we get handle the ECS json reports. You'll want to update this if you start getting interesting info other than the items (e.g., loadcellsensors, aborts, etc.) below
    def process_data(self, json_data):
        if json_data['command'] == 'DATA':
            data = json_data['data']

            load_cells = {f"{k}_sensorReading": v['sensorReading'] for k, v in data['loadCellSensors'].items()}
            pressure_sensors = {f"{k}_sensorReading": v['sensorReading'] for k, v in data['pressureSensors'].items()}
            temp_sensors = {f"{k}_sensorReading": v['sensorReading'] for k, v in data['tempSensors'].items()}
            valves = {k: v['valveState'] for k, v in data['valves'].items()}

            other_data = {
                'timestamp': json_data['timeStamp'],
                # 'currentState': json_data['currentState'],
                # 'engineSequence': json_data['engineSequence'],
                # 'sequenceProgress': json_data['sequenceProgress'],
                # 'recordedAbort': json_data['recordedAbort']
            }

            row_data = {**load_cells, **pressure_sensors, **temp_sensors, **valves, **other_data}

        if not self.header_written:
            self.csv_writer.writerow(row_data.keys())
            self.header_written = True

        self.csv_writer.writerow(row_data.values())
        self.csv_file.flush()

        # only upate the GUI with json report count at 2Hz (time.time is in *seconds* not ms)
        self.file_count += 1
        if(time.time() - self.last_gui_update_time > 0.5):
            self.file_count_label.config(text=f"JSON reports received: {self.file_count}")
            self.last_gui_update_time = time.time()


if __name__ == "__main__":
    root = Tk()
    root.geometry("1000x700")
    app = LoggerApp(root)
    root.mainloop()
