using Microsoft.AspNetCore.Hosting;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace YoutubeK.Services
{
    public interface IJsonFile
    {
        bool Write<T>(T obj);
        bool AppendAll<T>(List<T> objList);
        bool WriteAll<T>(List<T> objList, bool confirmed = false);
        IList<T> ReadAll<T>();
        bool DeleteAll<T>(bool confirmed = false);
    }
    public class JsonFile: IJsonFile
    {
        private IHostingEnvironment _env;
        private string folder;

        public JsonFile(IHostingEnvironment env)
        {
            _env = env;
            folder = Path.Combine(_env.ContentRootPath, @"Data\");
        }

        /// <summary>
        /// Append an object to JSON file.
        /// </summary>
        /// <param name="obj">An object of type T</param>
        bool IJsonFile.Write<T>(T obj)
        {
            try
            {
                string filePath = folder + typeof(T).Name + ".json";
                string json;
                using (var fileStream = File.Open(filePath, FileMode.OpenOrCreate, FileAccess.Read, FileShare.None))
                {
                    using (StreamReader sr = new StreamReader(fileStream))
                    {
                        json = sr.ReadToEnd();
                    }
                }

                var jdata = JsonConvert.DeserializeObject<List<T>>(json);
                var data = (List<T>)Activator.CreateInstance(typeof(List<T>));
                if (jdata == null || jdata.Count == 0)
                    data.Add(obj);
                else if (jdata.Count > 0)
                {
                    jdata.Add(obj);
                    data = jdata;
                }

                File.WriteAllText(filePath, JsonConvert.SerializeObject(data));
                return true;
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// Append a list of objects to JSON file.
        /// </summary>
        /// <param name="objList">An object of type List of T</param>
        public bool AppendAll<T>(List<T> objList)
        {
            try
            {
                string filePath = folder + typeof(T).Name + ".json";
                string json;
                using (var fileStream = File.Open(filePath, FileMode.OpenOrCreate, FileAccess.Read, FileShare.None))
                {
                    using (StreamReader sr = new StreamReader(fileStream))
                    {
                        json = sr.ReadToEnd();
                    }
                }

                var jdata = JsonConvert.DeserializeObject<List<T>>(json);
                var data = (List<T>)Activator.CreateInstance(typeof(List<T>));
                if (jdata == null || jdata.Count == 0)
                    data.AddRange(objList);
                else if (jdata.Count > 0)
                    data = jdata.Concat(objList).ToList();

                File.WriteAllText(filePath, JsonConvert.SerializeObject(data));

                return true;
            }
            catch
            {
                return false;
            }

        }

        /// <summary>
        /// Write a list of objects to JSON file.
        /// This deletes all previous data in the JSON file.
        /// </summary>
        /// <param name="objList">An object of type List of T</param>
        /// <param name="confirmed">You must set this to True, else it will behave like AppendAll()</param>
        bool IJsonFile.WriteAll<T>(List<T> objList, bool confirmed)
        {
            if(confirmed)
            {
                try
                {
                    string filePath = folder + typeof(T).Name + ".json";
                    File.WriteAllText(filePath, JsonConvert.SerializeObject(objList));
                    return true;
                }
                catch
                { }
            }
            else
            {
                AppendAll(objList);
            }
            return false;
        }

        /// <summary>
        /// Read the JSON file and return a List of type T.
        /// </summary>
        /// <returns>List of type T</returns>  
        IList<T> IJsonFile.ReadAll<T>()
        {
            try
            {
                string filePath = folder + typeof(T).Name + ".json"; ;
                using (var fileStream = File.Open(filePath, FileMode.OpenOrCreate))
                {
                    using (StreamReader sr = new StreamReader(fileStream))
                    {
                        var json = sr.ReadToEnd();
                        var data = JsonConvert.DeserializeObject<List<T>>(json);
                        return data;
                    }
                }
            }
            catch
            {
                return new List<T>();
            }
        }

        /// <summary>
        /// Deletes the JSON file.
        /// </summary>  
        /// <param name="confirmed">You must set this to True, else it will ignore the delete process.</param>
        bool IJsonFile.DeleteAll<T>(bool confirmed)
        {
            if(confirmed)
            {
                try
                {
                    string filePath = folder + typeof(T).Name + ".json";
                    if (File.Exists(filePath))
                    {
                        File.Delete(filePath);
                    }
                    return true;
                }
                catch { }
            }

            return false;
        }
    }
}
