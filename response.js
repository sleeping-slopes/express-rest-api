exports.status = (status, values,res) =>
{
    const data = { "status": status, "values": values };
    try
    {
        res.status(data.status);
        res.json(data);
        res.end();
    }
    catch(error)
    {
        console.log("error:"+error);
    }
}